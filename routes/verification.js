import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { verifyDisasterImage } from '../controllers/verificationController.js';

const router = express.Router();

router.post('/:disasterId/verify-image', authenticate, verifyDisasterImage);

export default router;