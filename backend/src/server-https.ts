import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';

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
import daoRoutes from '@/routes/dao.routes';
import { spotRoutes } from '@/routes/spot.routes';
import { airdropRoutes } from '@/routes/airdrop.routes';
import { dailyRewardsRoutes } from '@/routes/daily-rewards.routes';
import journalRoutes from '@/routes/journal.routes';

// Import services
import { SchedulerService } from '@/services/scheduler.service';
import { WebSocketService } from '@/services/websocket.service';

const app = express();
const PORT = process.env.PORT || 3002;
const WS_PORT = parseInt(process.env.WS_PORT || '5002');
const API_VERSION = process.env.API_VERSION || 'v1';

// HTTPS证书配置
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/private-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/certificate.pem')),
};

// Security middleware
app.use(helmet());

// CORS configuration - 添加HTTPS支持
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com', 'https://172.18.0.160:3000'] 
    : [
        'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 
        'http://localhost:3004', 'http://localhost:3005', 'http://localhost:3006',
        'http://172.18.0.160:3000', 'http://172.18.0.160:3001', 'http://172.18.0.160:3003',
        'http://172.18.0.160:3004', 'http://172.18.0.160:3005', 'http://172.18.0.160:3006',
        // 添加HTTPS支持
        'https://localhost:3000', 'https://localhost:3001', 'https://localhost:3003',
        'https://localhost:3004', 'https://localhost:3005', 'https://localhost:3006',
        'https://172.18.0.160:3000', 'https://172.18.0.160:3001', 'https://172.18.0.160:3003',
        'https://172.18.0.160:3004', 'https://172.18.0.160:3005', 'https://172.18.0.160:3006'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (more lenient in development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute in dev
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? '1000' : '100')), // 1000 req/min in dev, 100 req/15min in prod
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Only apply rate limiting in production or if explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
  app.use(limiter);
  Logger.info('Rate limiting enabled');
} else {
  Logger.info('Rate limiting disabled in development');
}

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
      },
      https: true // 标记这是HTTPS版本
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
app.use(`/api/${API_VERSION}/spot`, spotRoutes);
app.use(`/api/${API_VERSION}/airdrop`, airdropRoutes);
app.use(`/api/${API_VERSION}/daily-rewards`, dailyRewardsRoutes);
app.use(`/api/${API_VERSION}/journal`, journalRoutes);

// Import journal folders routes
import journalFoldersRoutes from './routes/journal-folders.routes';
app.use(`/api/${API_VERSION}/journal/folders`, journalFoldersRoutes);
app.use(`/api/${API_VERSION}`, daoRoutes);

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
    // WebSocketService.initialize(WS_PORT); // Temporarily disabled to avoid port conflicts

    // Start HTTPS server - bind to all network interfaces
    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
      Logger.info(`🚀 DePIN Dashboard HTTPS API server running on port ${PORT}`);
      Logger.info(`🔗 WebSocket server running on port ${WS_PORT}`);
      Logger.info(`📊 Health check available at https://localhost:${PORT}/health`);
      Logger.info(`📊 Network access available at https://172.18.0.160:${PORT}/health`);
      Logger.info(`🔗 API base URL: https://localhost:${PORT}/api/${API_VERSION}`);
      Logger.info(`🔗 Network API URL: https://172.18.0.160:${PORT}/api/${API_VERSION}`);
      Logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      Logger.info(`🔒 HTTPS enabled with self-signed certificate`);
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