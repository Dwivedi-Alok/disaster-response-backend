import express from 'express';
import { checkCache } from '../middleware/cache.js';
import { getSocialMediaReports } from '../controllers/socialMediaController.js';

const router = express.Router();

router.get('/:disasterId/social-media', checkCache('social'), getSocialMediaReports);

export default router;