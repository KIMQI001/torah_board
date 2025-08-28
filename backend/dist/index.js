"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const database_1 = require("@/services/database");
const solana_1 = require("@/utils/solana");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
// Import routes
const auth_routes_1 = require("@/routes/auth.routes");
const projects_routes_1 = require("@/routes/projects.routes");
const nodes_routes_1 = require("@/routes/nodes.routes");
const roi_routes_1 = require("@/routes/roi.routes");
const dashboard_routes_1 = require("@/routes/dashboard.routes");
const dao_routes_1 = __importDefault(require("@/routes/dao.routes"));
// Import services
const scheduler_service_1 = require("@/services/scheduler.service");
const websocket_service_1 = require("@/services/websocket.service");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const WS_PORT = parseInt(process.env.WS_PORT || '5002');
const API_VERSION = process.env.API_VERSION || 'v1';
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 'http://localhost:3005', 'http://localhost:3006'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting (more lenient in development)
const limiter = (0, express_rate_limit_1.default)({
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
    logger_1.Logger.info('Rate limiting enabled');
}
else {
    logger_1.Logger.info('Rate limiting disabled in development');
}
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    logger_1.Logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealthy = await database_1.database.healthCheck();
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
    }
    catch (error) {
        logger_1.Logger.error('Health check failed', { error: error.message });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Service unavailable'
        });
    }
});
// API routes
app.use(`/api/${API_VERSION}/auth`, auth_routes_1.authRoutes);
app.use(`/api/${API_VERSION}/projects`, projects_routes_1.projectsRoutes);
app.use(`/api/${API_VERSION}/nodes`, nodes_routes_1.nodesRoutes);
app.use(`/api/${API_VERSION}/roi`, roi_routes_1.roiRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboard_routes_1.dashboardRoutes);
app.use(`/api/${API_VERSION}`, dao_routes_1.default);
// 404 handler
app.use('*', (req, res) => {
    response_1.ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});
// Global error handler
app.use((err, req, res, next) => {
    logger_1.Logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });
    if (err.type === 'entity.parse.failed') {
        return response_1.ResponseUtil.error(res, 'Invalid JSON in request body', 400);
    }
    if (err.type === 'entity.too.large') {
        return response_1.ResponseUtil.error(res, 'Request body too large', 413);
    }
    response_1.ResponseUtil.serverError(res, process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error');
});
// Initialize services and start server
async function startServer() {
    try {
        // Initialize database connection
        await database_1.database.connect();
        // Initialize Solana connection
        solana_1.SolanaUtil.initialize();
        // Initialize scheduler service
        scheduler_service_1.SchedulerService.initialize();
        // Initialize WebSocket service
        websocket_service_1.WebSocketService.initialize(WS_PORT);
        // Start HTTP server
        app.listen(PORT, () => {
            logger_1.Logger.info(`🚀 DePIN Dashboard API server running on port ${PORT}`);
            logger_1.Logger.info(`🔗 WebSocket server running on port ${WS_PORT}`);
            logger_1.Logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
            logger_1.Logger.info(`🔗 API base URL: http://localhost:${PORT}/api/${API_VERSION}`);
            logger_1.Logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        logger_1.Logger.error('Failed to start server', { error: error.message });
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    logger_1.Logger.info('Received SIGINT, shutting down gracefully...');
    try {
        // Stop scheduler service
        scheduler_service_1.SchedulerService.stop();
        // Stop WebSocket service
        websocket_service_1.WebSocketService.stop();
        await database_1.database.disconnect();
        logger_1.Logger.info('Database disconnected');
        process.exit(0);
    }
    catch (error) {
        logger_1.Logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
    }
});
process.on('SIGTERM', async () => {
    logger_1.Logger.info('Received SIGTERM, shutting down gracefully...');
    try {
        // Stop scheduler service
        scheduler_service_1.SchedulerService.stop();
        // Stop WebSocket service
        websocket_service_1.WebSocketService.stop();
        await database_1.database.disconnect();
        logger_1.Logger.info('Database disconnected');
        process.exit(0);
    }
    catch (error) {
        logger_1.Logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
    }
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map