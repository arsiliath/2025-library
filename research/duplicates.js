#!/usr/bin/env node
import { promises as fsp, createReadStream, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const images_folder = "images/";

// Get the directory name for this file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively walks through a folder (and its children), skipping any folder whose name
 * matches the skipFolderName. Returns an array of full file paths.
 */
async function walkFolder(folder, skipFolderName) {
  let files = [];
  const entries = await fsp.readdir(folder, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === skipFolderName) continue;
      files = files.concat(await walkFolder(fullPath, skipFolderName));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Creates a SHA-256 hash for the given file.
 */
function makeHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function main() {
  // Get the folder to search from the command line or use the current folder.
  let baseFolder = process.argv[2] || process.cwd();
  // Append the images folder (e.g., if your images are in "images/")
  baseFolder = path.join(baseFolder, images_folder);
  
  console.log("Scanning in:", baseFolder);
  
  // Use walkFolder to get all files (skipping any folder named 'duplicates')
  const allFiles = await walkFolder(baseFolder, 'duplicates');
  console.log("Found", allFiles.length, "files");

  // Group files by their parent directory.
  // (Files in different folders will be processed separately.)
  const groups = new Map();
  for (const file of allFiles) {
    const dir = path.dirname(file);
    if (!groups.has(dir)) {
      groups.set(dir, []);
    }
    groups.get(dir).push(file);
  }

  // Process each folder group individually.
  const dupFolderName = 'duplicates';
  for (const [folder, files] of groups) {
    console.log(`\nProcessing folder: ${folder}`);
    // Create a duplicates folder inside the current folder.
    const dupFolderPath = path.join(folder, dupFolderName);
    try {
      await fsp.mkdir(dupFolderPath, { recursive: true });
    } catch (err) {
      console.error("Could not make the duplicates folder in", folder, ":", err);
      continue;
    }

    // Map to track seen file hashes in this folder.
    const seen = new Map();

    for (const file of files) {
      try {
        const hash = await makeHash(file);
        if (seen.has(hash)) {
          // Found a duplicate within this folder.
          const orig = seen.get(hash);
          console.log(
            `File ${pathToFileURL(file).href} is duplicate with file ${pathToFileURL(orig).href}`
          );

          // Move the duplicate file into the duplicates folder.
          const fileName = path.basename(file);
          let targetPath = path.join(dupFolderPath, fileName);
          let count = 1;
          // If a file with the same name exists in the duplicates folder, append a count.
          while (existsSync(targetPath)) {
            const parsed = path.parse(fileName);
            targetPath = path.join(dupFolderPath, `${parsed.name}_${count}${parsed.ext}`);
            count++;
          }
          await fsp.rename(file, targetPath);
        } else {
          seen.set(hash, file);
        }
      } catch (err) {
        console.error("Error working on", file, ":", err);
      }
    }
  }
  console.log("\nDone.");
}

main();
