import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/reports
router.post('/', authenticate, async (req, res) => {
  try {
    const { disaster_id, content, image_url } = req.body;
    const user_id = req.user.id;
    
    const { data, error } = await supabase
      .from('reports')
      .insert({
        disaster_id,
        user_id,
        content,
        image_url,
        verification_status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    logger.info(`Report created: ${data.id} by ${user_id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/disaster/:disasterId
router.get('/disaster/:disasterId', async (req, res) => {
  try {
    const { disasterId } = req.params;
    
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('disaster_id', disasterId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;