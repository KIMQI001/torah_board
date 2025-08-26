import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';

export interface ROICalculationRequest {
  projectId: string;
  location: string;
  customInvestment?: number;
  includeHardwareCost?: boolean;
  powerCostPerKWh?: number; // USD per kWh
  monthlyOperatingCost?: number; // Additional monthly costs
}

export interface ROICalculationResult {
  projectName: string;
  location: string;
  investment: {
    initial: number;
    hardware: number;
    total: number;
  };
  operatingCosts: {
    monthly: number;
    annual: number;
    powerCost: number;
  };
  earnings: {
    daily: number;
    monthly: number;
    annual: number;
  };
  roi: {
    breakEvenMonths: number;
    roi12Months: number; // ROI percentage after 12 months
    roi24Months: number; // ROI percentage after 24 months
    annualROI: number; // Annual ROI percentage
  };
  projectedEarnings: Array<{
    month: number;
    cumulativeEarnings: number;
    netProfit: number;
    roiPercentage: number;
  }>;
}

export class ROICalculatorService {
  /**
   * Calculate ROI for a DePIN project
   */
  static async calculateROI(request: ROICalculationRequest): Promise<ROICalculationResult | null> {
    try {
      Logger.info('Starting ROI calculation', { 
        projectId: request.projectId, 
        location: request.location 
      });

      // Get project details
      const project = await prisma.dePINProject.findUnique({
        where: { id: request.projectId }
      });

      if (!project) {
        Logger.warn('Project not found for ROI calculation', { projectId: request.projectId });
        return null;
      }

      // Parse hardware requirements
      let hardwareRequirements = [];
      try {
        hardwareRequirements = JSON.parse(project.hardwareRequirements);
      } catch (error) {
        Logger.warn('Failed to parse hardware requirements', { 
          projectId: request.projectId,
          error: error.message 
        });
      }

      // Calculate investment costs
      const hardwareCost = hardwareRequirements.reduce((total: number, hw: any) => 
        total + (hw.cost || 0), 0);
      
      const initialInvestment = request.customInvestment || project.minInvestment;
      const totalInvestment = initialInvestment + (request.includeHardwareCost !== false ? hardwareCost : 0);

      // Calculate power consumption and costs
      const totalPowerConsumption = hardwareRequirements.reduce((total: number, hw: any) => 
        total + (hw.powerConsumption || 0), 0); // Watts
      
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

      const result: ROICalculationResult = {
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

      Logger.info('ROI calculation completed', {
        projectName: project.name,
        totalInvestment,
        annualROI: result.roi.annualROI,
        breakEvenMonths: result.roi.breakEvenMonths
      });

      return result;

    } catch (error) {
      Logger.error('Error calculating ROI', {
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
  private static getLocationMultiplier(location: string, category: string): number {
    // Location-based multipliers for different regions and project types
    const locationMultipliers: { [key: string]: { [key: string]: number } } = {
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
  private static async storeROICalculation(
    request: ROICalculationRequest, 
    result: ROICalculationResult
  ): Promise<void> {
    try {
      await prisma.rOICalculation.create({
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

      Logger.debug('ROI calculation stored in database', {
        projectId: request.projectId,
        location: request.location
      });

    } catch (error) {
      Logger.error('Error storing ROI calculation', {
        error: error.message,
        projectId: request.projectId
      });
    }
  }

  /**
   * Get ROI comparison for multiple projects
   */
  static async compareProjects(projectIds: string[], location: string): Promise<{
    comparison: Array<{
      projectId: string;
      projectName: string;
      annualROI: number;
      breakEvenMonths: number;
      totalInvestment: number;
      riskLevel: string;
    }>;
    recommendation: string;
  }> {
    try {
      Logger.info('Starting project ROI comparison', { projectIds, location });

      const comparisons = [];
      
      for (const projectId of projectIds) {
        const roi = await this.calculateROI({
          projectId,
          location
        });

        if (roi) {
          const project = await prisma.dePINProject.findUnique({
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

      Logger.info('Project comparison completed', {
        projectCount: comparisons.length,
        topProject: comparisons[0]?.projectName
      });

      return {
        comparison: comparisons,
        recommendation
      };

    } catch (error) {
      Logger.error('Error in project comparison', {
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
  static async getROIHistory(projectId: string): Promise<Array<{
    date: string;
    location: string;
    annualROI: number;
    breakEvenMonths: number;
    totalInvestment: number;
  }>> {
    try {
      const history = await prisma.rOICalculation.findMany({
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

    } catch (error) {
      Logger.error('Error getting ROI history', {
        error: error.message,
        projectId
      });
      return [];
    }
  }
}