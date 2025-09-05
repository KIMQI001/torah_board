/**
 * Daily Rewards Controller
 */

import { Request, Response } from 'express';
import { DailyRewardsService } from '@/services/daily-rewards.service';
import { SchedulerService } from '@/services/scheduler.service';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';

export class DailyRewardsController {

  /**
   * Get user's rolling weekly rewards
   */
  static async getWeeklyRewards(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      Logger.info('Fetching weekly rewards', { userId, days });

      const rollingRewards = await DailyRewardsService.calculateRollingRewards(userId, days);

      ResponseUtil.success(res, rollingRewards, 'Weekly rewards fetched successfully');
    } catch (error: any) {
      Logger.error('Error fetching weekly rewards', {
        error: error.message,
        userId: req.params.userId
      });
      
      ResponseUtil.error(res, 'Failed to fetch weekly rewards', 500);
    }
  }

  /**
   * Get user's rewards history
   */
  static async getRewardsHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      Logger.info('Fetching rewards history', { userId, days });

      const history = await DailyRewardsService.getUserRewardsHistory(userId, days);

      ResponseUtil.success(res, history, 'Rewards history fetched successfully');
    } catch (error: any) {
      Logger.error('Error fetching rewards history', {
        error: error.message,
        userId: req.params.userId
      });
      
      ResponseUtil.error(res, 'Failed to fetch rewards history', 500);
    }
  }

  /**
   * Manually trigger daily rewards recording
   */
  static async triggerRecording(req: Request, res: Response): Promise<void> {
    try {
      Logger.info('Manual daily rewards recording triggered via API');

      const result = await SchedulerService.triggerDailyRewardsRecording();

      if (result.success) {
        ResponseUtil.success(res, result, result.message);
      } else {
        ResponseUtil.error(res, result.message, 500);
      }
    } catch (error: any) {
      Logger.error('Error triggering daily rewards recording', {
        error: error.message
      });
      
      ResponseUtil.error(res, 'Failed to trigger daily rewards recording', 500);
    }
  }

  /**
   * Record current day rewards (for testing)
   */
  static async recordToday(req: Request, res: Response): Promise<void> {
    try {
      Logger.info('Recording today\'s rewards via API');

      await DailyRewardsService.recordDailyRewards();

      ResponseUtil.success(res, { date: new Date().toISOString().split('T')[0] }, 'Today\'s rewards recorded successfully');
    } catch (error: any) {
      Logger.error('Error recording today\'s rewards', {
        error: error.message
      });
      
      ResponseUtil.error(res, 'Failed to record today\'s rewards', 500);
    }
  }
}