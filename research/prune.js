#!/usr/bin/env node
import fs from "fs";
import path from "path";

const imagesFolder = "images/";

// Make a backup of data.json (if it exists) by moving it to the research/data_log folder.
function backupDataJson() {
  try {
    if (fs.existsSync("data.json")) {
      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[-T:]/g, "-"); // Format: YYYY-MM-DD-HH-MM
      const backupDir = path.join("./research/data_log");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const backupFile = path.join(backupDir, `${timestamp}-data.json`);
      fs.renameSync("data.json", backupFile);
      console.log(`Backed up data.json as ${backupFile}`);
      return backupFile;
    } else {
      console.log("data.json not found. Nothing to back up.");
      process.exit(0);
    }
  } catch (err) {
    console.error("Error backing up data.json:", err);
    process.exit(1);
  }
}

// Prune entries from the data that do not have a matching image file.
function pruneData(data) {
  const pruned = {};
  const removed = [];
  for (const key in data) {
    // key is expected to be a file name (e.g. "pic.jpg").
    const imagePath = path.join(imagesFolder, key);
    if (!fs.existsSync(imagePath)) {
      removed.push(key);
    } else {
      pruned[key] = data[key];
    }
  }
  if (removed.length > 0) {
    console.log("Removed entries:", removed.join(", "));
  } else {
    console.log("No entries were removed.");
  }
  return pruned;
}

function main() {
  // Read in data.json before backing it up.
  if (!fs.existsSync("data.json")) {
    console.log("data.json not found. Nothing to prune.");
    process.exit(0);
  }
  let rawData;
  try {
    rawData = fs.readFileSync("data.json", "utf8");
  } catch (err) {
    console.error("Error reading data.json:", err);
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(rawData);
  } catch (err) {
    console.error("Error parsing data.json:", err);
    process.exit(1);
  }

  // Back up data.json first.
  backupDataJson();

  // Prune out entries whose image files are missing.
  const prunedData = pruneData(data);

  // Write the pruned data to a new data.json.
  try {
    fs.writeFileSync("data.json", JSON.stringify(prunedData, null, 2));
    console.log("Pruned data.json has been saved.");
  } catch (err) {
    console.error("Error writing new data.json:", err);
    process.exit(1);
  }
}

main();
