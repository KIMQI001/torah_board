import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      Logger.debug('Validation failed', { 
        endpoint: req.originalUrl,
        method: req.method,
        errors: errorMessages 
      });
      
      ResponseUtil.error(res, `Validation failed: ${errorMessages}`, 400);
      return;
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      Logger.debug('Query validation failed', { 
        endpoint: req.originalUrl,
        method: req.method,
        errors: errorMessages 
      });
      
      ResponseUtil.error(res, `Query validation failed: ${errorMessages}`, 400);
      return;
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // Wallet authentication
  walletAuth: Joi.object({
    walletAddress: Joi.string().required().min(32).max(44),
    publicKey: Joi.string().required().min(32).max(44),
    signature: Joi.string().required(),
    message: Joi.string().required()
  }),

  // Project creation
  createProject: Joi.object({
    name: Joi.string().required().min(1).max(100),
    category: Joi.string().valid('STORAGE', 'COMPUTING', 'WIRELESS', 'SENSORS').required(),
    description: Joi.string().required().min(10).max(1000),
    blockchain: Joi.string().required().min(1).max(50),
    tokenSymbol: Joi.string().required().min(1).max(20),
    tokenPrice: Joi.number().min(0).optional(),
    apy: Joi.string().required(),
    minInvestment: Joi.number().min(0).required(),
    roiPeriod: Joi.number().integer().min(1).max(240).required(),
    geographicFocus: Joi.array().items(Joi.string().min(1).max(50)).required(),
    riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').required(),
    hardwareRequirements: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        requirement: Joi.string().required(),
        cost: Joi.number().min(0).required(),
        powerConsumption: Joi.number().min(0).required()
      })
    ).required()
  }),

  // Node creation
  createNode: Joi.object({
    nodeIds: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
    projectId: Joi.string().required(),
    type: Joi.string().required().min(1).max(100),
    capacity: Joi.string().optional().max(100),
    location: Joi.string().optional().max(100),
    monitorUrl: Joi.string().uri().optional(),
    hardware: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        requirement: Joi.string().required(),
        cost: Joi.number().min(0).required(),
        powerConsumption: Joi.number().min(0).required()
      })
    ).optional()
  }),

  // Node update
  updateNode: Joi.object({
    type: Joi.string().min(1).max(100).optional(),
    capacity: Joi.string().max(100).optional(),
    location: Joi.string().max(100).optional(),
    monitorUrl: Joi.string().uri().allow('').optional(),
    status: Joi.string().valid('ONLINE', 'OFFLINE', 'SYNCING', 'ERROR').optional(),
    earnings: Joi.string().max(50).optional(),
    totalEarned: Joi.number().min(0).optional(),
    uptime: Joi.string().max(20).optional(),
    hardware: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        requirement: Joi.string().required(),
        cost: Joi.number().min(0).required(),
        powerConsumption: Joi.number().min(0).required()
      })
    ).optional()
  }),

  // ROI calculation
  roiCalculation: Joi.object({
    projectId: Joi.string().required(),
    location: Joi.string().required().min(1).max(100),
    customCost: Joi.number().min(0).optional()
  }),

  // Query parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
  }),

  // Node performance update
  nodePerformance: Joi.object({
    cpuUsage: Joi.number().min(0).max(100).required(),
    memoryUsage: Joi.number().min(0).max(100).required(),
    diskUsage: Joi.number().min(0).max(100).required(),
    networkLatency: Joi.number().min(0).required(),
    bandwidthUp: Joi.number().min(0).required(),
    bandwidthDown: Joi.number().min(0).required()
  })
};