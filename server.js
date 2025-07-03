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

// Define allowed origins in one place
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173', // Vite default
  'https://disaster-response-platform-2m98.vercel.app/', // Add your production frontend URL
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

// CORS configuration function
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  optionsSuccessStatus: 200 // For legacy browser support
};

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'], // Ensure both transports are available
  pingTimeout: 60000, // Increase timeout for slower connections
  pingInterval: 25000
});

// Apply CORS middleware to Express
app.use(cors(corsOptions));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  next();
});

// Initialize WebSocket
initializeWebSocket(io);

// API Routes - No authentication required for demo
app.use('/api/disasters', disastersRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/geocode', geocodingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', updatesRoutes);

// ✅ Root route for basic check
app.get('/', (req, res) => {
  res.json({
    message: '🌍 Disaster Response Backend is live!',
    version: '1.0.0',
    endpoints: {
      disasters: '/api/disasters',
      socialMedia: '/api/social-media',
      resources: '/api/resources',
      verification: '/api/verification',
      geocoding: '/api/geocode',
      reports: '/api/reports',
      health: '/health'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cors: {
      allowedOrigins: allowedOrigins.filter(o => o) // Show configured origins
    }
  });
});

// Socket.IO connection logging
io.on('connection', (socket) => {
  logger.info('New WebSocket connection', {
    id: socket.id,
    origin: socket.handshake.headers.origin
  });
  
  socket.on('disconnect', (reason) => {
    logger.info('WebSocket disconnected', {
      id: socket.id,
      reason
    });
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDev && { 
      stack: err.stack,
      details: err 
    })
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS enabled for origins:`, allowedOrigins.filter(o => o));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, io };
