"use strict";
/**
 * Daily Rewards Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyRewardsRoutes = void 0;
const express_1 = require("express");
const daily_rewards_controller_1 = require("@/controllers/daily-rewards.controller");
const router = (0, express_1.Router)();
exports.dailyRewardsRoutes = router;
// Get user's weekly rewards (rolling 7 days)
router.get('/weekly/:userId', daily_rewards_controller_1.DailyRewardsController.getWeeklyRewards);
// Get user's rewards history
router.get('/history/:userId', daily_rewards_controller_1.DailyRewardsController.getRewardsHistory);
// Manually trigger daily rewards recording
router.post('/trigger-recording', daily_rewards_controller_1.DailyRewardsController.triggerRecording);
// Record today's rewards (for testing)
router.post('/record-today', daily_rewards_controller_1.DailyRewardsController.recordToday);
//# sourceMappingURL=daily-rewards.routes.js.map