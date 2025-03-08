#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import natural from 'natural';
const { TfIdf } = natural;  // Extract TfIdf from natural

// Assume data.json is at the project root.
const dataPath = path.join(process.cwd(), 'data.json');
// Output file for TF-IDF vectors (project root).
const outputPath = path.join(process.cwd(), 'tfidf_vectors.json');

// Read dataset from data.json.
const rawData = fs.readFileSync(dataPath, 'utf8');
const dataset = JSON.parse(rawData);

// Create a TfIdf instance.
const tfidf = new TfIdf();
const docIndex = {};

// For each image, concatenate selected metadata fields into a document string.
Object.entries(dataset).forEach(([filename, meta]) => {
  const doc = [
    meta.artist,
    meta.year,
    meta.title,
    Array.isArray(meta.elements) ? meta.elements.join(' ') : meta.elements,
    Array.isArray(meta.significance) ? meta.significance.join(' ') : meta.significance,
    Array.isArray(meta.dominant_colors) ? meta.dominant_colors.join(' ') : meta.dominant_colors,
    Array.isArray(meta.mood) ? meta.mood.join(' ') : meta.mood,
    Array.isArray(meta.textures_and_lighting) ? meta.textures_and_lighting.join(' ') : meta.textures_and_lighting,
    meta.medium,
    Array.isArray(meta.topics) ? meta.topics.join(' ') : meta.topics
  ].join(' ');
  tfidf.addDocument(doc, filename);
  docIndex[filename] = tfidf.documents.length - 1;
});

// Build a dictionary that maps each filename to its TF‑IDF vector.
// The vector is represented as an object: { term: weight, ... }
const tfidfVectors = {};
Object.keys(dataset).forEach(filename => {
  const index = docIndex[filename];
  const terms = tfidf.listTerms(index); // Returns array of { term, tfidf }
  const vector = {};
  terms.forEach(item => {
    vector[item.term] = item.tfidf;
  });
  tfidfVectors[filename] = vector;
});

// Save the vectors to tfidf_vectors.json at the project root.
fs.writeFileSync(outputPath, JSON.stringify(tfidfVectors, null, 2));
console.log(`TF-IDF vectors computed and saved to ${outputPath}`);
