"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROICalculatorService = void 0;
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class ROICalculatorService {
    /**
     * Calculate ROI for a DePIN project
     */
    static async calculateROI(request) {
        try {
            logger_1.Logger.info('Starting ROI calculation', {
                projectId: request.projectId,
                location: request.location
            });
            // Get project details
            const project = await database_1.prisma.dePINProject.findUnique({
                where: { id: request.projectId }
            });
            if (!project) {
                logger_1.Logger.warn('Project not found for ROI calculation', { projectId: request.projectId });
                return null;
            }
            // Parse hardware requirements
            let hardwareRequirements = [];
            try {
                hardwareRequirements = JSON.parse(project.hardwareRequirements);
            }
            catch (error) {
                logger_1.Logger.warn('Failed to parse hardware requirements', {
                    projectId: request.projectId,
                    error: error.message
                });
            }
            // Calculate investment costs
            const hardwareCost = hardwareRequirements.reduce((total, hw) => total + (hw.cost || 0), 0);
            const initialInvestment = request.customInvestment || project.minInvestment;
            const totalInvestment = initialInvestment + (request.includeHardwareCost !== false ? hardwareCost : 0);
            // Calculate power consumption and costs
            const totalPowerConsumption = hardwareRequirements.reduce((total, hw) => total + (hw.powerConsumption || 0), 0); // Watts
            const powerCostPerKWh = request.powerCostPerKWh || 0.12; // Default $0.12 per kWh
            const monthlyPowerCost = (totalPowerConsumption / 1000) * 24 * 30 * powerCostPerKWh; // Monthly power cost
            const monthlyOperatingCost = (request.monthlyOperatingCost || 0) + monthlyPowerCost;
            const annualOperatingCost = monthlyOperatingCost * 12;
            // Calculate earnings based on APY and location factors
            const locationMultiplier = this.getLocationMultiplier(request.location, project.category);
            const baseAPY = parseFloat(project.apy.replace('%', '')) / 100;
            const adjustedAPY = baseAPY * locationMultiplier;
            const annualEarnings = totalInvestment * adjustedAPY;
            const monthlyEarnings = annualEarnings / 12;
            const dailyEarnings = annualEarnings / 365;
            // Calculate net earnings (after operating costs)
            const netMonthlyEarnings = monthlyEarnings - monthlyOperatingCost;
            const netAnnualEarnings = annualEarnings - annualOperatingCost;
            // Calculate ROI metrics
            const breakEvenMonths = netMonthlyEarnings > 0 ?
                Math.ceil(totalInvestment / netMonthlyEarnings) : -1;
            const roi12Months = netMonthlyEarnings > 0 ?
                ((netMonthlyEarnings * 12 - totalInvestment) / totalInvestment) * 100 : -100;
            const roi24Months = netMonthlyEarnings > 0 ?
                ((netMonthlyEarnings * 24 - totalInvestment) / totalInvestment) * 100 : -100;
            const annualROI = totalInvestment > 0 ? (netAnnualEarnings / totalInvestment) * 100 : 0;
            // Generate projected earnings for 24 months
            const projectedEarnings = [];
            let cumulativeEarnings = 0;
            for (let month = 1; month <= 24; month++) {
                cumulativeEarnings += netMonthlyEarnings;
                const netProfit = cumulativeEarnings - totalInvestment;
                const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
                projectedEarnings.push({
                    month,
                    cumulativeEarnings: Math.round(cumulativeEarnings * 100) / 100,
                    netProfit: Math.round(netProfit * 100) / 100,
                    roiPercentage: Math.round(roiPercentage * 100) / 100
                });
            }
            const result = {
                projectName: project.name,
                location: request.location,
                investment: {
                    initial: initialInvestment,
                    hardware: request.includeHardwareCost !== false ? hardwareCost : 0,
                    total: totalInvestment
                },
                operatingCosts: {
                    monthly: Math.round(monthlyOperatingCost * 100) / 100,
                    annual: Math.round(annualOperatingCost * 100) / 100,
                    powerCost: Math.round(monthlyPowerCost * 100) / 100
                },
                earnings: {
                    daily: Math.round(dailyEarnings * 100) / 100,
                    monthly: Math.round(monthlyEarnings * 100) / 100,
                    annual: Math.round(annualEarnings * 100) / 100
                },
                roi: {
                    breakEvenMonths,
                    roi12Months: Math.round(roi12Months * 100) / 100,
                    roi24Months: Math.round(roi24Months * 100) / 100,
                    annualROI: Math.round(annualROI * 100) / 100
                },
                projectedEarnings
            };
            // Store calculation in database for future reference
            await this.storeROICalculation(request, result);
            logger_1.Logger.info('ROI calculation completed', {
                projectName: project.name,
                totalInvestment,
                annualROI: result.roi.annualROI,
                breakEvenMonths: result.roi.breakEvenMonths
            });
            return result;
        }
        catch (error) {
            logger_1.Logger.error('Error calculating ROI', {
                error: error.message,
                projectId: request.projectId,
                location: request.location
            });
            return null;
        }
    }
    /**
     * Get location-based multiplier for earnings
     */
    static getLocationMultiplier(location, category) {
        // Location-based multipliers for different regions and project types
        const locationMultipliers = {
            'STORAGE': {
                'US-East': 1.0,
                'US-West': 0.95,
                'Europe': 0.9,
                'Asia-Pacific': 1.1,
                'Global': 1.0
            },
            'COMPUTING': {
                'US-East': 1.1,
                'US-West': 1.15,
                'Europe': 0.85,
                'Asia-Pacific': 0.9,
                'Global': 1.0
            },
            'WIRELESS': {
                'US-East': 1.05,
                'US-West': 1.02,
                'Europe': 0.98,
                'Asia-Pacific': 1.08,
                'Global': 1.0
            },
            'SENSORS': {
                'US-East': 1.0,
                'US-West': 1.0,
                'Europe': 1.05,
                'Asia-Pacific': 0.95,
                'Global': 1.0
            }
        };
        const categoryMultipliers = locationMultipliers[category.toUpperCase()] || locationMultipliers['STORAGE'];
        return categoryMultipliers[location] || categoryMultipliers['Global'] || 1.0;
    }
    /**
     * Store ROI calculation in database for analytics
     */
    static async storeROICalculation(request, result) {
        try {
            await database_1.prisma.rOICalculation.create({
                data: {
                    projectId: request.projectId,
                    location: request.location,
                    totalInvestment: result.investment.total,
                    monthlyEarnings: result.earnings.monthly,
                    monthlyOperatingCost: result.operatingCosts.monthly,
                    annualROI: result.roi.annualROI,
                    breakEvenMonths: result.roi.breakEvenMonths,
                    calculationData: JSON.stringify(result)
                }
            });
            logger_1.Logger.debug('ROI calculation stored in database', {
                projectId: request.projectId,
                location: request.location
            });
        }
        catch (error) {
            logger_1.Logger.error('Error storing ROI calculation', {
                error: error.message,
                projectId: request.projectId
            });
        }
    }
    /**
     * Get ROI comparison for multiple projects
     */
    static async compareProjects(projectIds, location) {
        try {
            logger_1.Logger.info('Starting project ROI comparison', { projectIds, location });
            const comparisons = [];
            for (const projectId of projectIds) {
                const roi = await this.calculateROI({
                    projectId,
                    location
                });
                if (roi) {
                    const project = await database_1.prisma.dePINProject.findUnique({
                        where: { id: projectId },
                        select: { riskLevel: true }
                    });
                    comparisons.push({
                        projectId,
                        projectName: roi.projectName,
                        annualROI: roi.roi.annualROI,
                        breakEvenMonths: roi.roi.breakEvenMonths,
                        totalInvestment: roi.investment.total,
                        riskLevel: project?.riskLevel || 'UNKNOWN'
                    });
                }
            }
            // Sort by ROI descending
            comparisons.sort((a, b) => b.annualROI - a.annualROI);
            // Generate recommendation
            let recommendation = '';
            if (comparisons.length > 0) {
                const best = comparisons[0];
                recommendation = `Based on ROI analysis, ${best.projectName} offers the highest annual ROI of ${best.annualROI}% with a break-even period of ${best.breakEvenMonths} months. Risk level: ${best.riskLevel}.`;
            }
            logger_1.Logger.info('Project comparison completed', {
                projectCount: comparisons.length,
                topProject: comparisons[0]?.projectName
            });
            return {
                comparison: comparisons,
                recommendation
            };
        }
        catch (error) {
            logger_1.Logger.error('Error in project comparison', {
                error: error.message,
                projectIds,
                location
            });
            return {
                comparison: [],
                recommendation: 'Unable to generate comparison due to calculation error.'
            };
        }
    }
    /**
     * Get historical ROI calculations for analytics
     */
    static async getROIHistory(projectId) {
        try {
            const history = await database_1.prisma.rOICalculation.findMany({
                where: { projectId },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            return history.map(calc => ({
                date: calc.createdAt.toISOString().split('T')[0],
                location: calc.location,
                annualROI: calc.annualROI,
                breakEvenMonths: calc.breakEvenMonths,
                totalInvestment: calc.totalInvestment
            }));
        }
        catch (error) {
            logger_1.Logger.error('Error getting ROI history', {
                error: error.message,
                projectId
            });
            return [];
        }
    }
}
exports.ROICalculatorService = ROICalculatorService;
//# sourceMappingURL=roi-calculator.service.js.map