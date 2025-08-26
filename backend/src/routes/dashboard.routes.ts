import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboard.controller';
import { authenticate } from '@/middleware/auth';
import { validateQuery } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get comprehensive dashboard statistics
router.get(
  '/stats',
  DashboardController.getDashboardStats
);

// Get scheduler status and information
router.get(
  '/scheduler/status',
  DashboardController.getSchedulerStatus
);

// Manually trigger capacity updates
router.post(
  '/capacity/update',
  DashboardController.triggerCapacityUpdate
);

// Get system health status
router.get(
  '/health',
  DashboardController.getSystemHealth
);

// Get platform-wide statistics
router.get(
  '/platform/stats',
  DashboardController.getPlatformStats
);

// Get earnings summary for different time periods
router.get(
  '/earnings',
  validateQuery(Joi.object({
    period: Joi.string().valid('7d', '30d', '90d', '1y').optional()
  })),
  DashboardController.getEarningsSummary
);

export { router as dashboardRoutes };