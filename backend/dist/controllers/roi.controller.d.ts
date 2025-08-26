import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class ROIController {
    /**
     * Calculate ROI for a specific project
     */
    static calculateROI(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Compare ROI across multiple projects
     */
    static compareProjects(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get ROI calculation history for a project
     */
    static getROIHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get popular locations for ROI calculations
     */
    static getPopularLocations(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get investment calculator parameters for a project
     */
    static getCalculatorParams(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=roi.controller.d.ts.map