// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// Create different rate limiters for different endpoints
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        user: req.user?.id
      });
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later.'
      });
    }
  };

  return rateLimit({ ...defaults, ...options });
};

// Specific rate limiters
const apiLimiter = createRateLimiter();

const strictLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: 'Too many requests to this endpoint'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many failed attempts'
});

export {
  apiLimiter,
  strictLimiter,
  authLimiter,
  createRateLimiter
};