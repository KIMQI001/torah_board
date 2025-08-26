import { Router } from 'express';
import { ROIController } from '@/controllers/roi.controller';
import { validate, schemas } from '@/middleware/validation';
import { authenticate } from '@/middleware/auth';
import Joi from 'joi';

const router = Router();

// All ROI routes require authentication
router.use(authenticate);

// Calculate ROI for a project
router.post(
  '/calculate',
  validate(Joi.object({
    projectId: Joi.string().required(),
    location: Joi.string().required().min(1).max(100),
    customInvestment: Joi.number().min(0).optional(),
    includeHardwareCost: Joi.boolean().optional(),
    powerCostPerKWh: Joi.number().min(0).max(1).optional(),
    monthlyOperatingCost: Joi.number().min(0).optional()
  })),
  ROIController.calculateROI
);

// Compare ROI across multiple projects
router.post(
  '/compare',
  validate(Joi.object({
    projectIds: Joi.array().items(Joi.string()).min(2).max(10).required(),
    location: Joi.string().required().min(1).max(100)
  })),
  ROIController.compareProjects
);

// Get ROI calculation history for a project
router.get(
  '/history/:projectId',
  ROIController.getROIHistory
);

// Get popular locations for ROI calculations
router.get(
  '/locations',
  ROIController.getPopularLocations
);

// Get investment calculator parameters for a project
router.get(
  '/params/:projectId',
  ROIController.getCalculatorParams
);

export { router as roiRoutes };