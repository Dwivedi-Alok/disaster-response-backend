// middleware/cache.js
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const checkCache = (keyPrefix) => {
  return async (req, res, next) => {
    const cacheKey = `${keyPrefix}:${JSON.stringify(req.query)}`;
    
    try {
      const { data: cached } = await supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', cacheKey)
        .single();
      
      if (cached && new Date(cached.expires_at) > new Date()) {
        logger.info(`Cache hit: ${cacheKey}`);
        return res.json(cached.value);
      }
    } catch (error) {
      logger.error('Cache check error:', error);
    }
    
    req.cacheKey = cacheKey;
    next();
  };
};

export const setCache = async (key, value, ttlMinutes = 60) => {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  
  try {
    await supabase
      .from('cache')
      .upsert({
        key,
        value,
        expires_at: expiresAt
      });
    logger.info(`Cache set: ${key}`);
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};