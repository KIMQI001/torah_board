/**
 * Daily Rewards Controller
 */
import { Request, Response } from 'express';
export declare class DailyRewardsController {
    /**
     * Get user's rolling weekly rewards
     */
    static getWeeklyRewards(req: Request, res: Response): Promise<void>;
    /**
     * Get user's rewards history
     */
    static getRewardsHistory(req: Request, res: Response): Promise<void>;
    /**
     * Manually trigger daily rewards recording
     */
    static triggerRecording(req: Request, res: Response): Promise<void>;
    /**
     * Record current day rewards (for testing)
     */
    static recordToday(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=daily-rewards.controller.d.ts.map