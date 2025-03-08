// app/controllers/tfidfController.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { imageData } from './datasetController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Cosine similarity between two vectors (represented as objects: { term: weight, ... })
function cosineSimilarity(vec1, vec2) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const term in vec1) {
    normA += vec1[term] ** 2;
    if (vec2[term]) {
      dot += vec1[term] * vec2[term];
    }
  }
  for (const term in vec2) {
    normB += vec2[term] ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Load the precomputed TF‑IDF vectors from a JSON file at the project root.
function loadTFIDFVectors() {
  const filePath = path.join(__dirname, '..', '..', 'tfidf_vectors.json');
  if (!fs.existsSync(filePath)) {
    throw new Error("TF-IDF vectors file not found. Please run the compute_tf_idf.js script first.");
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

// Endpoint handler for TF‑IDF–based similar images.
/**
 * Handles HTTP requests to retrieve similar images based on TF-IDF vector similarity.
 *
 * This function extracts the 'filename' and an optional 'folder' parameter from the request query.
 * It validates that the 'filename' is provided and exists in the image data. It loads the TF-IDF vectors
 * and verifies that a TF-IDF vector exists for the provided 'filename'. The function computes the cosine
 * similarity between the target image vector and all other image vectors. If a 'folder' filter is specified,
 * the similarities are filtered accordingly. The resulting list is sorted in descending order by similarity.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.filename - The filename of the image to find similar images for.
 * @param {string} [req.query.folder='all'] - An optional folder filter to limit the search scope.
 * @param {Object} res - The Express response object.
 * @returns {void} Sends a JSON response containing an array of related images or an error message.
 *
 * @throws {Error} If loading the TF-IDF vectors fails, a 500 status is returned with the error message.
 */
export function getSimilarImagesTfidfHandler(req, res) {
  const { filename, folder = 'all' } = req.query;
  if (!filename || !imageData[filename]) {
    return res.status(400).json({ error: "Invalid or missing filename" });
  }
  
  let tfidfVectors;
  try {
    tfidfVectors = loadTFIDFVectors();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  
  if (!tfidfVectors[filename]) {
    return res.status(400).json({ error: "No TF-IDF vector available for this image" });
  }
  
  const currentVec = tfidfVectors[filename];
  const similarities = [];
  
  console.log("GET /api/related_tfidf for filename:", filename);
  
  // Compute cosine similarity for all other images.
  for (const [otherFilename, vec] of Object.entries(tfidfVectors)) {
    if (otherFilename === filename) continue;
    const sim = cosineSimilarity(currentVec, vec);
    similarities.push({ filename: otherFilename, similarity: sim });
  }
  
  // Filter by folder if needed.
  let filtered = similarities;
  if (folder && folder !== 'all') {
    filtered = similarities.filter(item => item.filename.startsWith(folder + '/'));
  }
  
  // Sort descending by similarity.
  filtered.sort((a, b) => b.similarity - a.similarity);
  
  // Apply a threshold and limit the number of related items.
  const threshold = 0.15;
  let related = filtered.filter(item => item.similarity >= threshold);
  if (related.length > 100) {
    related = related.slice(0, 100);
  }
  
  res.json({ related });
}
