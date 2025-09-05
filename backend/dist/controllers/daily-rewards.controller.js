"use strict";
/**
 * Daily Rewards Controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyRewardsController = void 0;
const daily_rewards_service_1 = require("@/services/daily-rewards.service");
const scheduler_service_1 = require("@/services/scheduler.service");
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
class DailyRewardsController {
    /**
     * Get user's rolling weekly rewards
     */
    static async getWeeklyRewards(req, res) {
        try {
            const { userId } = req.params;
            const days = parseInt(req.query.days) || 7;
            logger_1.Logger.info('Fetching weekly rewards', { userId, days });
            const rollingRewards = await daily_rewards_service_1.DailyRewardsService.calculateRollingRewards(userId, days);
            response_1.responseHelper.success(res, rollingRewards, 'Weekly rewards fetched successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error fetching weekly rewards', {
                error: error.message,
                userId: req.params.userId
            });
            response_1.responseHelper.error(res, 'Failed to fetch weekly rewards', 500);
        }
    }
    /**
     * Get user's rewards history
     */
    static async getRewardsHistory(req, res) {
        try {
            const { userId } = req.params;
            const days = parseInt(req.query.days) || 30;
            logger_1.Logger.info('Fetching rewards history', { userId, days });
            const history = await daily_rewards_service_1.DailyRewardsService.getUserRewardsHistory(userId, days);
            response_1.responseHelper.success(res, history, 'Rewards history fetched successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error fetching rewards history', {
                error: error.message,
                userId: req.params.userId
            });
            response_1.responseHelper.error(res, 'Failed to fetch rewards history', 500);
        }
    }
    /**
     * Manually trigger daily rewards recording
     */
    static async triggerRecording(req, res) {
        try {
            logger_1.Logger.info('Manual daily rewards recording triggered via API');
            const result = await scheduler_service_1.SchedulerService.triggerDailyRewardsRecording();
            if (result.success) {
                response_1.responseHelper.success(res, result, result.message);
            }
            else {
                response_1.responseHelper.error(res, result.message, 500);
            }
        }
        catch (error) {
            logger_1.Logger.error('Error triggering daily rewards recording', {
                error: error.message
            });
            response_1.responseHelper.error(res, 'Failed to trigger daily rewards recording', 500);
        }
    }
    /**
     * Record current day rewards (for testing)
     */
    static async recordToday(req, res) {
        try {
            logger_1.Logger.info('Recording today\'s rewards via API');
            await daily_rewards_service_1.DailyRewardsService.recordDailyRewards();
            response_1.responseHelper.success(res, { date: new Date().toISOString().split('T')[0] }, 'Today\'s rewards recorded successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error recording today\'s rewards', {
                error: error.message
            });
            response_1.responseHelper.error(res, 'Failed to record today\'s rewards', 500);
        }
    }
}
exports.DailyRewardsController = DailyRewardsController;
//# sourceMappingURL=daily-rewards.controller.js.map