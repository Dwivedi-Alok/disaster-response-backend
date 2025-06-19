// controllers/socialMediaController.js
import { fetchSocialMediaReports, detectPriorityAlerts } from '../services/socialMediaService.js';
import { setCache } from '../middleware/cache.js';
import { logger } from '../utils/logger.js';

export const getSocialMediaReports = async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { keywords } = req.query;
    
    const keywordArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    // Fetch reports
    const reports = await fetchSocialMediaReports(disasterId, keywordArray);
    
    // Detect priority alerts
    const prioritizedReports = detectPriorityAlerts(reports);
    
    // Cache the results
    if (req.cacheKey) {
      await setCache(req.cacheKey, prioritizedReports, 5); // 5 minute cache
    }
    
    logger.info(`Social media reports fetched for disaster: ${disasterId}, count: ${reports.length}`);
    
    res.json(prioritizedReports);
  } catch (error) {
    logger.error('Get social media reports error:', error);
    res.status(500).json({ error: error.message });
  }
};