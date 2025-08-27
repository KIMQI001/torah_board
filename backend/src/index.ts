import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { database } from '@/services/database';
import { SolanaUtil } from '@/utils/solana';
import { Logger } from '@/utils/logger';
import { ResponseUtil } from '@/utils/response';

// Import routes
import { authRoutes } from '@/routes/auth.routes';
import { projectsRoutes } from '@/routes/projects.routes';
import { nodesRoutes } from '@/routes/nodes.routes';
import { roiRoutes } from '@/routes/roi.routes';
import { dashboardRoutes } from '@/routes/dashboard.routes';

// Import services
import { SchedulerService } from '@/services/scheduler.service';
import { WebSocketService } from '@/services/websocket.service';

const app = express();
const PORT = process.env.PORT || 5000;
const WS_PORT = parseInt(process.env.WS_PORT || '5002');
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005', 'http://localhost:3006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await database.healthCheck();
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        server: 'healthy'
      }
    };

    if (!dbHealthy) {
      return res.status(503).json({
        ...healthStatus,
        status: 'degraded'
      });
    }

    res.json(healthStatus);
  } catch (error) {
    Logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/projects`, projectsRoutes);
app.use(`/api/${API_VERSION}/nodes`, nodesRoutes);
app.use(`/api/${API_VERSION}/roi`, roiRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);

// 404 handler
app.use('*', (req, res) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  if (err.type === 'entity.parse.failed') {
    return ResponseUtil.error(res, 'Invalid JSON in request body', 400);
  }

  if (err.type === 'entity.too.large') {
    return ResponseUtil.error(res, 'Request body too large', 413);
  }

  ResponseUtil.serverError(res, 
    process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error'
  );
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize database connection
    await database.connect();
    
    // Initialize Solana connection
    SolanaUtil.initialize();
    
    // Initialize scheduler service
    SchedulerService.initialize();
    
    // Initialize WebSocket service
    WebSocketService.initialize(WS_PORT);

    // Start HTTP server
    app.listen(PORT, () => {
      Logger.info(`🚀 DePIN Dashboard API server running on port ${PORT}`);
      Logger.info(`🔗 WebSocket server running on port ${WS_PORT}`);
      Logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
      Logger.info(`🔗 API base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      Logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    Logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  Logger.info('Received SIGINT, shutting down gracefully...');
  
  try {
    // Stop scheduler service
    SchedulerService.stop();
    
    // Stop WebSocket service
    WebSocketService.stop();
    
    await database.disconnect();
    Logger.info('Database disconnected');
    process.exit(0);
  } catch (error) {
    Logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  Logger.info('Received SIGTERM, shutting down gracefully...');
  
  try {
    // Stop scheduler service
    SchedulerService.stop();
    
    // Stop WebSocket service
    WebSocketService.stop();
    
    await database.disconnect();
    Logger.info('Database disconnected');
    process.exit(0);
  } catch (error) {
    Logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

// Start the server
startServer();