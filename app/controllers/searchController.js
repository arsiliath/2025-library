import natural from 'natural';
import * as fuzzball from 'fuzzball';
import { imageData, reverseIndex, defaultArray } from './datasetController.js';

const stemmer = natural.PorterStemmer;

/**
 * Handles search requests for image data by filtering based on a search query,
 * applying fuzzy matching or exact substring search, and using folder and
 * pagination parameters.
 *
 * The handler processes the query parameters as follows:
 * - The "q" parameter serves as the search term. If wrapped in quotes, it performs an exact
 *   substring search; otherwise, it applies fuzzy matching using stemmed keywords and a
 *   reverse index with a similarity threshold.
 * - The "page" and "limit" parameters determine the pagination of results.
 * - The "folder" parameter filters the results to a specific folder unless it is set to "all".
 * - If no search query is provided, a default array of files is used.
 *
 * The function extracts the relevant search parameters from the request query, performs
 * filtering and matching against stored image metadata, then paginates the results and
 * sends a JSON response that includes the paginated results and the total count of matches.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} [req.query.q] - The search query; supports fuzzy matching or exact substring search if wrapped in quotes.
 * @param {number} [req.query.page=1] - The page number for paginated results.
 * @param {number} [req.query.limit=20] - The maximum number of results to return per page.
 * @param {string} [req.query.folder="all"] - The folder to filter results; if not "all", only results starting with the folder are returned.
 * @param {Object} res - The Express response object.
 *
 * @throws {Error} Throws an error if the search operation fails.
 *
 * @returns {void} Sends a JSON response with the paginated search results and the total count:
 *   {
 *     results: Array<{ filename: string, ...metadata }>,
 *     total: number
 *   }
 */
export function searchHandler(req, res) {
  try {
    const { q, page = 1, limit = 20, folder = 'all' } = req.query;
    console.log(`Search request: query='${q}', folder='${folder}', page=${page}, limit=${limit}`);
    let matchedArray;

    if (q) {
      // If query is wrapped in quotes, do an exact substring search
      if (q.startsWith('"') && q.endsWith('"')) {
        const phrase = q.slice(1, -1).toLowerCase();
        matchedArray = Object.keys(imageData).filter(file => {
          const metadataString = JSON.stringify(imageData[file]).toLowerCase();
          return metadataString.includes(phrase);
        });
      } else {
        // Otherwise, perform fuzzy matching
        let matchedFiles = new Set(Object.keys(imageData));
        let fuzzyMatches = new Set();
        const keywords = q.toLowerCase().split(/\s+/).map(word => stemmer.stem(word));

        keywords.forEach(keyword => {
          matchedFiles = new Set([...matchedFiles].filter(file => {
            const metadataString = JSON.stringify(imageData[file]).toLowerCase();
            return metadataString.split(/\W+/).some(word => stemmer.stem(word) === keyword);
          }));

          Object.keys(reverseIndex).forEach(indexWord => {
            if (fuzzball.token_set_ratio(keyword, indexWord) > 75) {
              reverseIndex[indexWord].forEach(file => fuzzyMatches.add(file));
            }
          });
        });

        matchedFiles = new Set([...matchedFiles, ...fuzzyMatches]);
        matchedArray = Array.from(matchedFiles);
      }
    } else {
      matchedArray = defaultArray;
    }

    // Apply folder filter if not "all"
    if (folder !== 'all') {
      matchedArray = matchedArray.filter(file => file.startsWith(folder + '/'));
    }

    const paginatedResults = matchedArray
      .slice((page - 1) * limit, page * limit)
      .map(file => ({ filename: file, ...imageData[file] }));

    res.json({ results: paginatedResults, total: matchedArray.length });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
}
