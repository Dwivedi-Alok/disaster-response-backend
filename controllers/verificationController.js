// controllers/verificationController.js
import { verifyImage } from '../services/geminiService.js';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const verifyDisasterImage = async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { image_url, report_id } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    // Verify the image using Gemini
    const verification = await verifyImage(image_url);
    
    // If report_id is provided, update the report
    if (report_id) {
      const { error } = await supabase
        .from('reports')
        .update({
          verification_status: verification.confidence > 70 ? 'verified' : 'suspicious'
        })
        .eq('id', report_id);
      
      if (error) {
        logger.error('Update report verification error:', error);
      }
    }
    
    logger.info(`Image verified for disaster ${disasterId}: ${verification.status} (${verification.confidence}%)`);
    
    res.json({
      disaster_id: disasterId,
      image_url,
      verification
    });
  } catch (error) {
    logger.error('Image verification error:', error);
    res.status(500).json({ error: error.message });
  }
};