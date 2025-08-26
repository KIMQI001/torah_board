import { Router } from 'express';
import { NodesController } from '@/controllers/nodes.controller';
import { validate, validateQuery, schemas } from '@/middleware/validation';
import { authenticate } from '@/middleware/auth';
import Joi from 'joi';

const router = Router();

// All node routes require authentication
router.use(authenticate);

// Get user's nodes with optional filtering
router.get(
  '/',
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('online', 'offline', 'syncing', 'error').optional(),
    projectId: Joi.string().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })),
  NodesController.getUserNodes
);

// Get single node by ID
router.get(
  '/:id',
  NodesController.getNode
);

// Create new nodes (batch support)
router.post(
  '/',
  validate(schemas.createNode),
  NodesController.createNodes
);

// Update node
router.put(
  '/:id',
  validate(schemas.updateNode),
  NodesController.updateNode
);

// Delete node
router.delete(
  '/:id',
  NodesController.deleteNode
);

// Update node performance data
router.post(
  '/:id/performance',
  validate(schemas.nodePerformance),
  NodesController.updateNodePerformance
);

// Get node performance history
router.get(
  '/:id/performance',
  validateQuery(Joi.object({
    hours: Joi.number().min(1).max(720).optional(), // Max 30 days
    limit: Joi.number().integer().min(1).max(1000).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })),
  NodesController.getNodePerformanceHistory
);

// Update node capacity (manual trigger)
router.post(
  '/:id/capacity',
  NodesController.updateNodeCapacity
);

// Batch update capacities for all nodes without capacity
router.post(
  '/capacity/update',
  NodesController.batchUpdateCapacities
);

export { router as nodesRoutes };