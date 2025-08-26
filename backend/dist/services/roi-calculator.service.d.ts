export interface ROICalculationRequest {
    projectId: string;
    location: string;
    customInvestment?: number;
    includeHardwareCost?: boolean;
    powerCostPerKWh?: number;
    monthlyOperatingCost?: number;
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
        roi12Months: number;
        roi24Months: number;
        annualROI: number;
    };
    projectedEarnings: Array<{
        month: number;
        cumulativeEarnings: number;
        netProfit: number;
        roiPercentage: number;
    }>;
}
export declare class ROICalculatorService {
    /**
     * Calculate ROI for a DePIN project
     */
    static calculateROI(request: ROICalculationRequest): Promise<ROICalculationResult | null>;
    /**
     * Get location-based multiplier for earnings
     */
    private static getLocationMultiplier;
    /**
     * Store ROI calculation in database for analytics
     */
    private static storeROICalculation;
    /**
     * Get ROI comparison for multiple projects
     */
    static compareProjects(projectIds: string[], location: string): Promise<{
        comparison: Array<{
            projectId: string;
            projectName: string;
            annualROI: number;
            breakEvenMonths: number;
            totalInvestment: number;
            riskLevel: string;
        }>;
        recommendation: string;
    }>;
    /**
     * Get historical ROI calculations for analytics
     */
    static getROIHistory(projectId: string): Promise<Array<{
        date: string;
        location: string;
        annualROI: number;
        breakEvenMonths: number;
        totalInvestment: number;
    }>>;
}
//# sourceMappingURL=roi-calculator.service.d.ts.map