"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodesRoutes = void 0;
const express_1 = require("express");
const nodes_controller_1 = require("@/controllers/nodes.controller");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.nodesRoutes = router;
// All node routes require authentication
router.use(auth_1.authenticate);
// Get user's nodes with optional filtering
router.get('/', (0, validation_1.validateQuery)(joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    status: joi_1.default.string().valid('online', 'offline', 'syncing', 'error').optional(),
    projectId: joi_1.default.string().optional(),
    sortBy: joi_1.default.string().optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').optional()
})), nodes_controller_1.NodesController.getUserNodes);
// Get single node by ID
router.get('/:id', nodes_controller_1.NodesController.getNode);
// Create new nodes (batch support)
router.post('/', (0, validation_1.validate)(validation_1.schemas.createNode), nodes_controller_1.NodesController.createNodes);
// Update node
router.put('/:id', (0, validation_1.validate)(validation_1.schemas.updateNode), nodes_controller_1.NodesController.updateNode);
// Delete node
router.delete('/:id', nodes_controller_1.NodesController.deleteNode);
// Update node performance data
router.post('/:id/performance', (0, validation_1.validate)(validation_1.schemas.nodePerformance), nodes_controller_1.NodesController.updateNodePerformance);
// Get node performance history
router.get('/:id/performance', (0, validation_1.validateQuery)(joi_1.default.object({
    hours: joi_1.default.number().min(1).max(720).optional(), // Max 30 days
    limit: joi_1.default.number().integer().min(1).max(1000).optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').optional()
})), nodes_controller_1.NodesController.getNodePerformanceHistory);
// Update node capacity (manual trigger)
router.post('/:id/capacity', nodes_controller_1.NodesController.updateNodeCapacity);
// Batch update capacities for all nodes without capacity
router.post('/capacity/update', nodes_controller_1.NodesController.batchUpdateCapacities);
//# sourceMappingURL=nodes.routes.js.map