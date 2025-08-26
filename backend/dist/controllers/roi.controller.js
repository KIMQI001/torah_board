"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROIController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const roi_calculator_service_1 = require("@/services/roi-calculator.service");
class ROIController {
    /**
     * Calculate ROI for a specific project
     */
    static async calculateROI(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { projectId, location, customInvestment, includeHardwareCost = true, powerCostPerKWh = 0.12, monthlyOperatingCost = 0 } = req.body;
            const roiResult = await roi_calculator_service_1.ROICalculatorService.calculateROI({
                projectId,
                location,
                customInvestment,
                includeHardwareCost,
                powerCostPerKWh,
                monthlyOperatingCost
            });
            if (!roiResult) {
                response_1.ResponseUtil.notFound(res, 'Project not found or ROI calculation failed');
                return;
            }
            response_1.ResponseUtil.success(res, roiResult, 'ROI calculation completed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error calculating ROI', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Compare ROI across multiple projects
     */
    static async compareProjects(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { projectIds, location } = req.body;
            if (!Array.isArray(projectIds) || projectIds.length === 0) {
                response_1.ResponseUtil.error(res, 'Project IDs array is required');
                return;
            }
            if (!location) {
                response_1.ResponseUtil.error(res, 'Location is required');
                return;
            }
            const comparison = await roi_calculator_service_1.ROICalculatorService.compareProjects(projectIds, location);
            response_1.ResponseUtil.success(res, comparison, 'Project comparison completed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error comparing projects', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get ROI calculation history for a project
     */
    static async getROIHistory(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { projectId } = req.params;
            const history = await roi_calculator_service_1.ROICalculatorService.getROIHistory(projectId);
            response_1.ResponseUtil.success(res, {
                projectId,
                history
            }, 'ROI history retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting ROI history', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get popular locations for ROI calculations
     */
    static async getPopularLocations(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // Popular locations for different types of DePIN projects
            const locations = [
                {
                    name: 'US-East',
                    description: 'Eastern United States',
                    powerCost: 0.13, // USD per kWh
                    advantages: ['Low latency', 'Stable internet', 'Moderate costs'],
                    bestFor: ['Storage', 'Computing']
                },
                {
                    name: 'US-West',
                    description: 'Western United States',
                    powerCost: 0.18,
                    advantages: ['High tech adoption', 'Good infrastructure'],
                    bestFor: ['Computing', 'Sensors']
                },
                {
                    name: 'Europe',
                    description: 'European Union',
                    powerCost: 0.25,
                    advantages: ['Strong regulations', 'High adoption'],
                    bestFor: ['Sensors', 'Wireless']
                },
                {
                    name: 'Asia-Pacific',
                    description: 'Asia Pacific Region',
                    powerCost: 0.08,
                    advantages: ['Low power costs', 'Growing market'],
                    bestFor: ['Storage', 'Wireless']
                },
                {
                    name: 'Canada',
                    description: 'Canada',
                    powerCost: 0.10,
                    advantages: ['Low power costs', 'Cold climate for computing'],
                    bestFor: ['Computing', 'Storage']
                },
                {
                    name: 'Global',
                    description: 'Global Average',
                    powerCost: 0.12,
                    advantages: ['Balanced metrics', 'General purpose'],
                    bestFor: ['All types']
                }
            ];
            response_1.ResponseUtil.success(res, { locations }, 'Popular locations retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting popular locations', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get investment calculator parameters for a project
     */
    static async getCalculatorParams(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { projectId } = req.params;
            const project = await roi_calculator_service_1.ROICalculatorService.calculateROI({
                projectId,
                location: 'Global' // Use global as default for parameter calculation
            });
            if (!project) {
                response_1.ResponseUtil.notFound(res, 'Project not found');
                return;
            }
            const params = {
                projectName: project.projectName,
                minInvestment: project.investment.initial,
                hardwareCost: project.investment.hardware,
                estimatedPowerConsumption: project.operatingCosts.powerCost * 1000 / (30 * 24 * 0.12), // Approximate watts
                defaultParams: {
                    powerCostPerKWh: 0.12,
                    monthlyOperatingCost: 0,
                    includeHardwareCost: true
                },
                locationSuggestions: ['US-East', 'US-West', 'Europe', 'Asia-Pacific', 'Canada', 'Global']
            };
            response_1.ResponseUtil.success(res, params, 'Calculator parameters retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting calculator parameters', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
}
exports.ROIController = ROIController;
//# sourceMappingURL=roi.controller.js.map