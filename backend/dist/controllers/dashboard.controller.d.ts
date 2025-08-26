import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class DashboardController {
    /**
     * Get comprehensive dashboard statistics
     */
    static getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get scheduler status and information
     */
    static getSchedulerStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Manually trigger capacity updates for all nodes
     */
    static triggerCapacityUpdate(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get system health status
     */
    static getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get platform-wide statistics (for admin users)
     */
    static getPlatformStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get earnings summary for different time periods
     */
    static getEarningsSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dashboard.controller.d.ts.map