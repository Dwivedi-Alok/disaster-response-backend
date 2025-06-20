import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './utils/logger.js';
import { initializeWebSocket } from './utils/websocket.js';

// Import routes
import disastersRoutes from './routes/disasters.js';
import socialMediaRoutes from './routes/socialMedia.js';
import resourcesRoutes from './routes/resources.js';
import verificationRoutes from './routes/verification.js';
import geocodingRoutes from './routes/geocoding.js';
import reportsRoutes from './routes/reports.js';
import updatesRoutes from './routes/updates.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5173', // Vite default
        process.env.FRONTEND_URL
      ].filter(Boolean); // Remove any undefined values
      
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize WebSocket
initializeWebSocket(io);

// Routes
app.use('/api/disasters', disastersRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/geocode', geocodingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', updatesRoutes);

// ✅ Root route for basic check
app.get('/', (req, res) => {
  res.send('🌍 Disaster Response Backend is live!');
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
