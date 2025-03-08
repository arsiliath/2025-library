// app/controllers/fileController.js
import { imageData } from './datasetController.js';

/**
 * Handles the HTTP GET request to retrieve metadata for a specified file.
 *
 * The function expects the file path to be present in req.params[0], where the file path is URL-encoded.
 * It checks if the file exists in the `imageData` store and, if found, responds with a JSON object containing
 * the file name and its associated metadata. If the file is not found, it responds with a 404 error and a JSON
 * error message.
 *
 * @param {object} req - The Express request object, which must include the file path as req.params[0].
 * @param {object} res - The Express response object used to send back the JSON response.
 * @returns {void} Does not return a value. Sends a JSON response with the file metadata or an error message.
 */
export function getFileMetadataHandler(req, res) {
  // req.params[0] contains the full path, e.g., "foo/Photo%20XX.jpg"
  const file = req.params[0];
  if (imageData[file]) {
    res.json({ filename: file, ...imageData[file] });
  } else {
    res.status(404).json({ error: "File not found" });
  }
}
