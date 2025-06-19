// routes/disasters.js
import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  createDisaster,
  getDisasters,
  updateDisaster,
  deleteDisaster
} from '../controllers/disasterController.js';

const router = express.Router();

// POST /api/disasters - Create a new disaster (requires authentication)
router.post('/', authenticate, createDisaster);

// GET /api/disasters - Get all disasters (public)
router.get('/', getDisasters);

// PUT /api/disasters/:id - Update a disaster (requires authentication)
router.put('/:id', authenticate, updateDisaster);

// DELETE /api/disasters/:id - Delete a disaster (requires authentication)
router.delete('/:id', authenticate, deleteDisaster);

export default router;