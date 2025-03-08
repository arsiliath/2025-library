// renameKeys.mjs
import { readFile, writeFile } from 'fs/promises';

// Define the folder name you want to prepend
const folderName = 'ars'; // Change this to your desired folder name

// Input and output file names
const inputFile = 'data.json';
const outputFile = 'data-renamed.json';

async function renameKeys() {
  try {
    // Read and parse the original JSON data
    const rawData = await readFile(inputFile, 'utf8');
    const data = JSON.parse(rawData);

    // Create a new object with renamed keys
    const renamedData = {};

    // Iterate over each key in the original data
    for (const [originalKey, value] of Object.entries(data)) {
      // Prepend the folder name and a forward slash to the key
      const newKey = `${folderName}/${originalKey}`;
      renamedData[newKey] = value;
    }

    // Write the updated data to a new file
    await writeFile(outputFile, JSON.stringify(renamedData, null, 2), 'utf8');
    console.log(`Renamed keys successfully. Output written to ${outputFile}`);
  } catch (error) {
    console.error('Error processing JSON file:', error);
  }
}

// Run the function
renameKeys();
