// app/routes/api.js
import express from 'express';
import { searchHandler } from '../controllers/searchController.js';
import { getFoldersHandler } from '../controllers/foldersController.js';
import { getFileMetadataHandler } from '../controllers/fileController.js';
import { retryHandler } from '../controllers/retryController.js';
import { getSimilarImagesHandler } from '../controllers/similarController.js';
import { getSimilarImagesTfidfHandler } from '../controllers/tfidfController.js';

const router = express.Router();

router.get('/search', searchHandler);
router.get('/folders', getFoldersHandler);
router.get('/files/*', getFileMetadataHandler);
router.get('/related', getSimilarImagesHandler);       // your current similarity
router.get('/related_tfidf', getSimilarImagesTfidfHandler); // new TF-IDF endpoint
router.post('/retry', retryHandler);

export default router;
