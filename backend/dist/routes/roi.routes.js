"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roiRoutes = void 0;
const express_1 = require("express");
const roi_controller_1 = require("@/controllers/roi.controller");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.roiRoutes = router;
// All ROI routes require authentication
router.use(auth_1.authenticate);
// Calculate ROI for a project
router.post('/calculate', (0, validation_1.validate)(joi_1.default.object({
    projectId: joi_1.default.string().required(),
    location: joi_1.default.string().required().min(1).max(100),
    customInvestment: joi_1.default.number().min(0).optional(),
    includeHardwareCost: joi_1.default.boolean().optional(),
    powerCostPerKWh: joi_1.default.number().min(0).max(1).optional(),
    monthlyOperatingCost: joi_1.default.number().min(0).optional()
})), roi_controller_1.ROIController.calculateROI);
// Compare ROI across multiple projects
router.post('/compare', (0, validation_1.validate)(joi_1.default.object({
    projectIds: joi_1.default.array().items(joi_1.default.string()).min(2).max(10).required(),
    location: joi_1.default.string().required().min(1).max(100)
})), roi_controller_1.ROIController.compareProjects);
// Get ROI calculation history for a project
router.get('/history/:projectId', roi_controller_1.ROIController.getROIHistory);
// Get popular locations for ROI calculations
router.get('/locations', roi_controller_1.ROIController.getPopularLocations);
// Get investment calculator parameters for a project
router.get('/params/:projectId', roi_controller_1.ROIController.getCalculatorParams);
//# sourceMappingURL=roi.routes.js.map