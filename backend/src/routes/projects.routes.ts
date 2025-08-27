import { Router } from 'express';
import { ProjectsController } from '@/controllers/projects.controller';
import { validate, validateQuery, schemas } from '@/middleware/validation';
import { authenticate, optionalAuth } from '@/middleware/auth';
import Joi from 'joi';

const router = Router();

// Get all projects (public, with optional auth for personalization)
router.get(
  '/',
  optionalAuth,
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    category: Joi.string().valid('storage', 'computing', 'wireless', 'sensors').optional(),
    riskLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    blockchain: Joi.string().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })),
  ProjectsController.getProjects
);

// Get projects by category (public)
router.get(
  '/category/:category',
  validateQuery(schemas.pagination),
  ProjectsController.getProjectsByCategory
);

// Get single project (public)
router.get(
  '/:id',
  ProjectsController.getProject
);

// Create new project (authenticated users only)
router.post(
  '/',
  authenticate,
  validate(schemas.createProject),
  ProjectsController.createProject
);

// Update project (authenticated users only)
router.put(
  '/:id',
  authenticate,
  validate(Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    category: Joi.string().valid('STORAGE', 'COMPUTING', 'WIRELESS', 'SENSORS').optional(),
    description: Joi.string().min(10).max(1000).optional(),
    blockchain: Joi.string().min(1).max(50).optional(),
    tokenSymbol: Joi.string().min(1).max(20).optional(),
    tokenPrice: Joi.number().min(0).optional(),
    apy: Joi.string().optional(),
    minInvestment: Joi.number().min(0).optional(),
    roiPeriod: Joi.number().integer().min(1).max(240).optional(),
    geographicFocus: Joi.array().items(Joi.string().min(1).max(50)).optional(),
    riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
    hardwareRequirements: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        requirement: Joi.string().required(),
        cost: Joi.number().min(0).required(),
        powerConsumption: Joi.number().min(0).required()
      })
    ).optional(),
    websiteUrl: Joi.string().uri().optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE').optional()
  })),
  ProjectsController.updateProject
);

// Delete project (authenticated users only)
router.delete(
  '/:id',
  authenticate,
  ProjectsController.deleteProject
);

export { router as projectsRoutes };