"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsRoutes = void 0;
const express_1 = require("express");
const projects_controller_1 = require("@/controllers/projects.controller");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.projectsRoutes = router;
// Get all projects (public, with optional auth for personalization)
router.get('/', auth_1.optionalAuth, (0, validation_1.validateQuery)(joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    category: joi_1.default.string().valid('storage', 'computing', 'wireless', 'sensors').optional(),
    riskLevel: joi_1.default.string().valid('low', 'medium', 'high').optional(),
    blockchain: joi_1.default.string().optional(),
    sortBy: joi_1.default.string().optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').optional()
})), projects_controller_1.ProjectsController.getProjects);
// Get projects by category (public)
router.get('/category/:category', (0, validation_1.validateQuery)(validation_1.schemas.pagination), projects_controller_1.ProjectsController.getProjectsByCategory);
// Get single project (public)
router.get('/:id', projects_controller_1.ProjectsController.getProject);
// Create new project (authenticated users only)
router.post('/', auth_1.authenticate, (0, validation_1.validate)(validation_1.schemas.createProject), projects_controller_1.ProjectsController.createProject);
// Update project (authenticated users only)
router.put('/:id', auth_1.authenticate, (0, validation_1.validate)(joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).optional(),
    category: joi_1.default.string().valid('STORAGE', 'COMPUTING', 'WIRELESS', 'SENSORS').optional(),
    description: joi_1.default.string().min(10).max(1000).optional(),
    blockchain: joi_1.default.string().min(1).max(50).optional(),
    tokenSymbol: joi_1.default.string().min(1).max(20).optional(),
    tokenPrice: joi_1.default.number().min(0).optional(),
    apy: joi_1.default.string().optional(),
    minInvestment: joi_1.default.number().min(0).optional(),
    roiPeriod: joi_1.default.number().integer().min(1).max(240).optional(),
    geographicFocus: joi_1.default.array().items(joi_1.default.string().min(1).max(50)).optional(),
    riskLevel: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
    hardwareRequirements: joi_1.default.array().items(joi_1.default.object({
        type: joi_1.default.string().required(),
        requirement: joi_1.default.string().required(),
        cost: joi_1.default.number().min(0).required(),
        powerConsumption: joi_1.default.number().min(0).required()
    })).optional(),
    websiteUrl: joi_1.default.string().uri().optional(),
    status: joi_1.default.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE').optional()
})), projects_controller_1.ProjectsController.updateProject);
// Delete project (authenticated users only)
router.delete('/:id', auth_1.authenticate, projects_controller_1.ProjectsController.deleteProject);
//# sourceMappingURL=projects.routes.js.map