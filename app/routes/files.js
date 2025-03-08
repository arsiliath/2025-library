// app/routes/files.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// file.html is in the project root, so go up two levels.
router.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..',  'file.html'));
});

export default router;
