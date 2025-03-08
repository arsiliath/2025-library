// app/controllers/datasetController.js
/**
 * @file datasetController.js
 * @description This module handles dataset-related functionalities for an image classification application.
 * It loads the image dataset from a JSON file, enriches each image with a creation timestamp based on file
 * metadata, rebuilds a reverse index from the image metadata for efficient search operations, and prepares
 * an array of image filenames. The dataset is located at the project root (data.json) and the related images
 * are stored in a designated images folder.
 */


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// data.json is in the project root and images are in ../images
const dataPath = path.join(__dirname, '..', '..', 'data.json');
const imagesFolder = path.join(__dirname, '..', '..', 'images');

export let imageData = {};
export let reverseIndex = {};
export let defaultArray = [];

// This function loads the image dataset from a JSON file and enriches each image with a creation timestamp.
// It then rebuilds a reverse index to facilitate metadata searches and prepares an array of image filenames.
export async function loadDataset() {
  try {
    console.log("Loading dataset...");
    imageData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Add file modified timestamps (older of birthtime or mtime)
    Object.keys(imageData).forEach(filename => {
      const filePath = path.join(imagesFolder, filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const birthTime = stats.birthtime.getTime();
        const modifiedTime = stats.mtime.getTime();
        imageData[filename].created_at = new Date(Math.min(birthTime, modifiedTime)).toISOString();
      } else {
        imageData[filename].created_at = "Unknown";
      }
    });

    rebuildIndex();

    defaultArray = Array.from(new Set(Object.keys(imageData)));

    console.log("Dataset loaded and reverse index built.");
  } catch (err) {
    console.error("Error loading dataset:", err);
  }
}

/**
 * Rebuilds the reverse search index for image metadata.
 *
 * This function iterates over each entry in the globally available `imageData` object.
 * For every image's metadata, it converts the metadata to a lowercase string, splits
 * it into individual words, and adds the corresponding file name to a Set in the global
 * `reverseIndex` object under each word as a key.
 *
 * Note: Both `imageData` and `reverseIndex` are assumed to be available in the global scope.
 */
function rebuildIndex() {
  reverseIndex = {};
  Object.entries(imageData).forEach(([fname, metadata]) => {
    const searchableFields = JSON.stringify(metadata).toLowerCase();
    searchableFields.split(/\W+/).forEach(word => {
      if (!reverseIndex[word]) reverseIndex[word] = new Set();
      reverseIndex[word].add(fname);
    });
  });
}
