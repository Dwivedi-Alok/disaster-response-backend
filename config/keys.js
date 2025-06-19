// backend/config/keys.js
export const server = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

export const database = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY
};

export const apis = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro'
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY
  },
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN
  },
  bluesky: {
    apiKey: process.env.BLUESKY_API_KEY
  }
};

export const rateLimiting = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
};

export const cache = {
  ttl: {
    default: 60, // minutes
    socialMedia: 5,
    officialUpdates: 60,
    geocoding: 1440 // 24 hours
  }
};

// Export as default object as well if needed
export default {
  server,
  database,
  apis,
  rateLimiting,
  cache
};