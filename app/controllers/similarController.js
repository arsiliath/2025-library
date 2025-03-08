// app/controllers/similarController.js
import { imageData } from './datasetController.js';

function computeSimilarity(meta1, meta2) {
  // Consider these fields for similarity.
  const fields = ['year', 'elements', 'significance', 'dominant_colors', 'mood', 'textures_and_lighting', 'topics'];
  let intersection = 0;
  let union = 0;

  fields.forEach(field => {
    const set1 = new Set();
    const set2 = new Set();

    if (meta1[field]) {
      if (Array.isArray(meta1[field])) {
        meta1[field].forEach(item => set1.add(item.toLowerCase().trim()));
      } else {
        meta1[field].toString().split(/[,\s]+/).forEach(item => {
          if (item) set1.add(item.toLowerCase().trim());
        });
      }
    }
    if (meta2[field]) {
      if (Array.isArray(meta2[field])) {
        meta2[field].forEach(item => set2.add(item.toLowerCase().trim()));
      } else {
        meta2[field].toString().split(/[,\s]+/).forEach(item => {
          if (item) set2.add(item.toLowerCase().trim());
        });
      }
    }
    const unionSet = new Set([...set1, ...set2]);
    union += unionSet.size;
    set1.forEach(item => {
      if (set2.has(item)) intersection++;
    });
  });

  return union > 0 ? intersection / union : 0;
}

export function getSimilarImagesHandler(req, res) {
  const { filename, folder = 'all' } = req.query;

  if (!filename || !imageData[filename]) {
    return res.status(400).json({ error: "Invalid or missing filename" });
  }
  const currentMeta = imageData[filename];
  const similarities = [];

  console.log("GET /api/related for filename:", filename);

  for (const [otherFilename, otherMeta] of Object.entries(imageData)) {
    if (otherFilename === filename) continue;
    const sim = computeSimilarity(currentMeta, otherMeta);
    similarities.push({ filename: otherFilename, similarity: sim });
  }
  // If a folder filter is provided and not "all", filter results.
  let filtered = similarities;
  if (folder && folder !== 'all') {
    filtered = similarities.filter(item => item.filename.startsWith(folder + '/'));
  }
  filtered.sort((a, b) => b.similarity - a.similarity);
  let related = filtered.filter(item => item.similarity >= 0.15);
  if(related.length <= 10) {
    related = filtered.slice(0, 10);
  }
  res.json({ related });
}
