import express from 'express';
import { geocodeFromDescription } from '../controllers/geocodingController.js';

const router = express.Router();

router.post('/', geocodeFromDescription);

export default router;