// This file handles the research process of analyzing images using OpenAI's API. It reads images from a folder, processes them using the OpenAI API, and saves the results to a data.json file. The script can be run with an optional mode argument to process all images or only new images.
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";

const images_folder = "images/";

dotenv.config();

const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BATCH_SIZE = 5; // Number of parallel API requests at a time
const SAVE_INTERVAL = 10; // Save progress every 10 files

const encode = (p) => fs.readFileSync(p).toString("base64");

// Archive old data.json and create a new one
const archiveDataJson = () => {
  try {
    if (fs.existsSync("data.json")) {
      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[-T:]/g, "-"); // Format: YYYY-MM-DD-HH-MM
      const archiveDir = path.join("./research/data_log");
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      const archiveFilename = path.join(archiveDir, `${timestamp}-data.json`);
      fs.renameSync("data.json", archiveFilename);
      console.log(`Archived old data.json as ${archiveFilename}`);
    }
  } catch (err) {
    console.error("Error archiving data.json:", err);
  }
};

// Analyze an image using OpenAI's chat API
const analyze = async (p, index, total) => {
  const file = path.basename(p);
  console.log(`Processing image ${index + 1} of ${total}: ${file}`);

  const prompt = `
You are an expert curator analyzing an image for an exhibit.

The file name is: ${file}. Use this (if helpful) to figure out what is going on. For example if it's picasso_paintingname.jpg then that would tell you about the artist and name.

This is a museum curation task. Provide both visual elements and inferred historical, cultural, or scientific significance.

Provide both a visual breakdown and inferred meaning based on historical or cultural knowledge. 
List key elements separated by commas. Do not use full sentences.

1. Who is the artist? Who created the image? If unknown, infer based on context.
2. What year was the image created? Provide an estimated timeframe if unknown.
3. What is the title of the image? (leave blank if unknown)
4. List key elements in the image (e.g., man, geometric symbols, instructional pose, movement analysis, dance notation, Labanotation, abstract shapes, historical photograph).
5. What historical, scientific, or artistic significance does this image have? Use keywords.
6. Is the image in color or black and white?
7. List the dominant colors or color palette in the image.
8. Does the image exhibit symmetry or asymmetry?
9. Describe the perspective and depth in the image (e.g., flat, deep, linear perspective) using keywords.
10. List words that describe the overall mood or emotion conveyed by the image.
11. List notable textures or lighting features in the image using keywords.
12. What type of medium does the image represent (e.g., painting, photograph, digital art)?
13. What high level topics or classes of thing or practice does the image relate to? (eg fashion show, graphic design, choreography, painting, science, music)

Return a JSON object with the following structure:
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
}`;

  const content = [
    { type: "text", text: prompt },
    {
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${encode(p)}` },
    },
  ];

  try {
    const response = await oai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: content }],
    });

    const jsonResponse = response.choices[0].message.content;
    let parsed;

    try {
      parsed = JSON.parse(jsonResponse.replace(/```json|```/g, ""));
    } catch (parseError) {
      console.error(`Failed to parse JSON for ${file}:`, parseError.message);
      return { error: "Failed to parse JSON", raw: jsonResponse };
    }

    console.log(`Analyzed ${file}:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`Error with ${file}:`, error.message);
    return { error: error.message };
  }
};

// Helper function to recursively gather image files as relative paths.
const getAllImageFiles = (dir, baseDir = dir) => {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllImageFiles(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
        // Save the file as a path relative to the base images folder and normalize to forward slashes.
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        results.push(relativePath);
      }
    }
  }
  return results;
};

// Process images in a folder, optionally in "add_new" mode to skip existing images.
const processImages = async (folder, mode = "add_new") => {
  let existingData = {};

  console.log(`Processing images in ${folder} in ${mode} mode...`);

  if (mode === "add_new" && fs.existsSync("data.json")) {
    try {
      existingData = JSON.parse(fs.readFileSync("data.json", "utf8"));
      // Normalize existing keys to use forward slashes.
      const normalizedData = {};
      Object.keys(existingData).forEach(key => {
        normalizedData[key.replace(/\\/g, '/')] = existingData[key];
      });
      existingData = normalizedData;
    } catch (err) {
      console.error("Error reading existing data.json, proceeding with fresh start:", err);
    }
  } else {
    console.log("Starting fresh with no existing data.json.");
  }

  // Get all image files recursively as relative paths.
  const allRelativeFiles = getAllImageFiles(folder, folder);
  console.log(`Found ${allRelativeFiles.length} image files in total.`);

  // Filter for new files if mode is "add_new"
  const newFiles =
    mode === "add_new"
      ? allRelativeFiles.filter((file) => !existingData[file])
      : allRelativeFiles;
  console.log(`Found ${newFiles.length} new images to process.`);

  if (newFiles.length === 0) {
    console.log("No new images to process.");
    return;
  }

  archiveDataJson();

  // The results object uses the relative file path as its key.
  const results = mode === "add_new" ? existingData : {};
  let index = 0;

  while (index < newFiles.length) {
    const batch = newFiles.slice(index, index + BATCH_SIZE);
    console.log(
      `Processing batch: ${index + 1} - ${Math.min(
        index + BATCH_SIZE,
        newFiles.length
      )} of ${newFiles.length}`
    );

    const batchResults = await Promise.allSettled(
      batch.map((relativeFile, i) => {
        // Construct the full file path.
        const fullPath = path.join(folder, relativeFile);
        return analyze(fullPath, index + i, newFiles.length).then((result) => ({
          file: relativeFile,
          result,
        }));
      })
    );

    batchResults.forEach(({ status, value }) => {
      if (status === "fulfilled" && !value.result?.error) {
        results[value.file] = value.result;
      } else {
        console.error(
          `Skipping ${value?.file || "unknown file"} due to error:`,
          value?.result?.error || value?.reason
        );
      }
    });

    index += BATCH_SIZE;

    if (index % SAVE_INTERVAL < BATCH_SIZE) {
      fs.writeFileSync("data.json", JSON.stringify(results, null, 2));
      console.log(`Progress saved to data.json at ${index} files.`);
    }
  }

  fs.writeFileSync("data.json", JSON.stringify(results, null, 2));
  console.log(`Final save to data.json complete.`);
};

// Run the script with optional mode argument (default is "add_new")
const mode = process.argv[2] || "add_new";
processImages(images_folder, mode);
