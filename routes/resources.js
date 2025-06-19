import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNearbyResources, createResource } from '../controllers/resourceController.js';

const router = express.Router();

// GET /api/resources/:disasterId/resources
router.get('/:disasterId/resources', getNearbyResources);

// POST /api/resources/:disasterId/resources
router.post('/:disasterId/resources', authenticate, createResource);

export default router;