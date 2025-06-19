// routes/updates.js  (or whatever name you’re using)
import express from 'express';
import { checkCache, setCache } from '../middleware/cache.js';
import { fetchOfficialUpdates } from '../services/browsePageService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/disasters/:id/official-updates
router.get(
  '/disasters/:id/official-updates',
  checkCache('official'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = await fetchOfficialUpdates(id);

      // Cache for 60 seconds if a cache key was set by checkCache middleware
      if (req.cacheKey) {
        await setCache(req.cacheKey, updates, 60);
      }

      res.json(updates);
    } catch (error) {
      logger.error('Get official updates error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;