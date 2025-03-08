// app/controllers/retryController.js
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { imageData } from './datasetController.js';

dotenv.config();
const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handles a retry request to re-analyze an image based on user-provided corrections.
 *
 * This asynchronous function performs the following:
 *  - Decodes the filename from the request and validates its existence in the image data.
 *  - Constructs the file path for the image stored in the images folder.
 *  - Generates a prompt incorporating the image details, previous analysis, and user corrections.
 *  - Reads the image file, encodes it to base64, and sends it with the prompt to an AI chat completion endpoint.
 *  - Parses the JSON response from the AI, updates the image data with the new analysis, and writes the updated dataset to disk.
 *  - Returns a JSON response including the updated analysis or an error message if any step fails.
 *
 * @async
 * @function retryHandler
 * @param {import('express').Request} req - The Express request object, containing:
 *   @property {Object} body - The request body.
 *   @property {string} body.filename - The URL-encoded name of the image file.
 *   @property {string} body.correction - The user's correction note for the previous analysis.
 * @param {import('express').Response} res - The Express response object used to send back a JSON response.
 * @returns {Promise<void>} A promise that resolves once the retry operation is complete.
 * @throws {Error} Throws an error if the image file is not found, if JSON parsing fails, or if any file or API-related operation fails.
 */
export async function retryHandler(req, res) {
  try {
    let { filename, correction } = req.body;
    filename = decodeURIComponent(filename);

    if (!filename || !imageData[filename]) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Compute the file path.
    // __dirname is "project-root/app/controllers" so go up two levels into project-root/images.
    const imagesFolder = path.join(__dirname, '..', '..', 'images');
    const filePath = path.join(imagesFolder, filename);

    const prompt = `
You are an expert curator analyzing an image for an exhibit.
The file name is: ${filename}.

The previous analysis was:
${JSON.stringify(imageData[filename], null, 2)}

The user notes that the analysis is off. Here is the correction:
${correction}

Please provide a revised JSON analysis with these fields:
{
    artist: "",
    year: "",
    title: "",
    elements: [],
    significance: [],
    color: false,
    dominant_colors: [],
    symmetry: "",
    perspective: "",
    mood: [],
    textures_and_lighting: [],
    medium: "",
    topics: []
}
    
Include only JSON data in your response, no other text.`;

    const base64Image = fs.readFileSync(filePath).toString("base64");
    const content = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
    ];

    const response = await oai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: content }]
    });

    const jsonResponse = response.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(jsonResponse.replace(/```json|```/g, ""));
    } catch (parseError) {
      console.error(`Failed to parse JSON for ${filename}:`, parseError.message);
      return res.status(500).json({ error: "Failed to parse JSON", raw: jsonResponse });
    }

    // Update the dataset.
    imageData[filename] = parsed;
    const dataPath = path.join(__dirname, '..', 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(imageData, null, 2));
    res.json({ filename, ...parsed });
  } catch (error) {
    console.error("Error in retry endpoint:", error.message);
    res.status(500).json({ error: error.message });
  }
}
