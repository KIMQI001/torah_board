"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const dashboard_controller_1 = require("@/controllers/dashboard.controller");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.dashboardRoutes = router;
// All dashboard routes require authentication
router.use(auth_1.authenticate);
// Get comprehensive dashboard statistics
router.get('/stats', dashboard_controller_1.DashboardController.getDashboardStats);
// Get scheduler status and information
router.get('/scheduler/status', dashboard_controller_1.DashboardController.getSchedulerStatus);
// Manually trigger capacity updates
router.post('/capacity/update', dashboard_controller_1.DashboardController.triggerCapacityUpdate);
// Get system health status
router.get('/health', dashboard_controller_1.DashboardController.getSystemHealth);
// Get platform-wide statistics
router.get('/platform/stats', dashboard_controller_1.DashboardController.getPlatformStats);
// Get earnings summary for different time periods
router.get('/earnings', (0, validation_1.validateQuery)(joi_1.default.object({
    period: joi_1.default.string().valid('7d', '30d', '90d', '1y').optional()
})), dashboard_controller_1.DashboardController.getEarningsSummary);
//# sourceMappingURL=dashboard.routes.js.map