// app/index.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

import apiRoutes from './routes/api.js';
import fileRoutes from './routes/files.js';
import { loadDataset } from './controllers/datasetController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openBrowser = false;

// Middleware
app.use(express.json());

// Serve static images (images folder is one level up)
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Serve the main frontend page (index.html is in the project root)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Use API routes for /api/*
app.use('/api', apiRoutes);

// Use file routes for /files/*
app.use('/files', fileRoutes);

// Start server and load dataset
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await loadDataset();
  // Optionally, open the browser:
  if(openBrowser) {
    await open(`http://localhost:${PORT}`);
  }
});
