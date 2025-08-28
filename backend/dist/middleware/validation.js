"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validateQuery = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            logger_1.Logger.debug('Validation failed', {
                endpoint: req.originalUrl,
                method: req.method,
                errors: errorMessages
            });
            response_1.ResponseUtil.error(res, `Validation failed: ${errorMessages}`, 400);
            return;
        }
        next();
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.query, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            logger_1.Logger.debug('Query validation failed', {
                endpoint: req.originalUrl,
                method: req.method,
                errors: errorMessages
            });
            response_1.ResponseUtil.error(res, `Query validation failed: ${errorMessages}`, 400);
            return;
        }
        next();
    };
};
exports.validateQuery = validateQuery;
// Common validation schemas
exports.schemas = {
    // Wallet authentication
    walletAuth: joi_1.default.object({
        walletAddress: joi_1.default.string().required().min(32).max(44),
        publicKey: joi_1.default.string().required().min(32).max(44),
        signature: joi_1.default.string().required(),
        message: joi_1.default.string().required()
    }),
    // Project creation
    createProject: joi_1.default.object({
        name: joi_1.default.string().required().min(1).max(100),
        category: joi_1.default.string().valid('STORAGE', 'COMPUTING', 'WIRELESS', 'SENSORS').required(),
        description: joi_1.default.string().required().min(10).max(1000),
        blockchain: joi_1.default.string().required().min(1).max(50),
        tokenSymbol: joi_1.default.string().required().min(1).max(20),
        websiteUrl: joi_1.default.string().uri().required(),
        tokenPrice: joi_1.default.number().min(0).optional(),
        // 以下字段将使用默认值
        apy: joi_1.default.string().optional().default('15%'),
        minInvestment: joi_1.default.number().min(0).optional().default(1000),
        roiPeriod: joi_1.default.number().integer().min(1).max(240).optional().default(12),
        geographicFocus: joi_1.default.array().items(joi_1.default.string().min(1).max(50)).optional().default(['全球']),
        riskLevel: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH').optional().default('MEDIUM'),
        hardwareRequirements: joi_1.default.array().items(joi_1.default.object({
            type: joi_1.default.string().required(),
            requirement: joi_1.default.string().required(),
            cost: joi_1.default.number().min(0).required(),
            powerConsumption: joi_1.default.number().min(0).required()
        })).optional().default([])
    }),
    // Node creation
    createNode: joi_1.default.object({
        nodeIds: joi_1.default.array().items(joi_1.default.string().min(1).max(100)).min(1).required(),
        projectId: joi_1.default.string().required(),
        type: joi_1.default.string().required().min(1).max(100),
        capacity: joi_1.default.string().optional().max(100),
        location: joi_1.default.string().optional().max(100),
        monitorUrl: joi_1.default.string().uri().optional(),
        hardware: joi_1.default.array().items(joi_1.default.object({
            type: joi_1.default.string().required(),
            requirement: joi_1.default.string().required(),
            cost: joi_1.default.number().min(0).required(),
            powerConsumption: joi_1.default.number().min(0).required()
        })).optional()
    }),
    // Node update
    updateNode: joi_1.default.object({
        type: joi_1.default.string().min(1).max(100).optional(),
        capacity: joi_1.default.string().max(100).optional(),
        location: joi_1.default.string().max(100).optional(),
        monitorUrl: joi_1.default.string().uri().allow('').optional(),
        status: joi_1.default.string().valid('ONLINE', 'OFFLINE', 'SYNCING', 'ERROR').optional(),
        earnings: joi_1.default.string().max(50).optional(),
        totalEarned: joi_1.default.number().min(0).optional(),
        uptime: joi_1.default.string().max(20).optional(),
        hardware: joi_1.default.array().items(joi_1.default.object({
            type: joi_1.default.string().required(),
            requirement: joi_1.default.string().required(),
            cost: joi_1.default.number().min(0).required(),
            powerConsumption: joi_1.default.number().min(0).required()
        })).optional()
    }),
    // ROI calculation
    roiCalculation: joi_1.default.object({
        projectId: joi_1.default.string().required(),
        location: joi_1.default.string().required().min(1).max(100),
        customCost: joi_1.default.number().min(0).optional()
    }),
    // Query parameters
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).optional().default(1),
        limit: joi_1.default.number().integer().min(1).max(100).optional().default(20),
        sortBy: joi_1.default.string().optional(),
        sortOrder: joi_1.default.string().valid('asc', 'desc').optional().default('desc')
    }),
    // Node performance update
    nodePerformance: joi_1.default.object({
        cpuUsage: joi_1.default.number().min(0).max(100).required(),
        memoryUsage: joi_1.default.number().min(0).max(100).required(),
        diskUsage: joi_1.default.number().min(0).max(100).required(),
        networkLatency: joi_1.default.number().min(0).required(),
        bandwidthUp: joi_1.default.number().min(0).required(),
        bandwidthDown: joi_1.default.number().min(0).required()
    })
};
//# sourceMappingURL=validation.js.map