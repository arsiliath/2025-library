import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Load your API key from the environment
});

// Function to encode the image as Base64
function encodeImage(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString("base64");
}

// Path to the image
const imagePath = "images/klee.jpg";

// Encode the image
const base64Image = encodeImage(imagePath);

// Make the API call
async function analyzeImage() {
    try {
        const response = await openai.chat.completions.create({
            // model: "gpt-4o-mini",  // mini thinks it was Kandinsky
            model: "gpt-4o", 
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "What is in this image? Who painted it?",
                        },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                        },
                    ],
                },
            ],
        });

        console.log("Response:", response.choices[0].message.content);
    } catch (error) {
        console.error("Error analyzing the image:", error.message);
    }
}

// Execute the function
analyzeImage();
