// app/controllers/foldersController.js
import { imageData } from './datasetController.js';

/**
 * Retrieves folder names from the imageData object keys and sends them as a JSON response.
 *
 * The function filters keys containing a '/', then uses the first segment (before the '/') as the folder name.
 * It then sorts the folder names alphabetically and determines the default folder using the DEFAULT_FOLDER 
 * environment variable, defaulting to 'all' if not set.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with a JSON object containing the sorted list of folders and the default folder.
 */
export function getFoldersHandler(req, res) {
  const foldersSet = new Set();
  Object.keys(imageData).forEach(key => {
    if (key.includes('/')) {
      foldersSet.add(key.split('/')[0]);
    }
  });
  const folders = Array.from(foldersSet).sort();
  const defaultFolder = process.env.DEFAULT_FOLDER || 'all';
  res.json({ folders, default: defaultFolder });
}
