/**
 * Daily Rewards Routes
 */

import { Router } from 'express';
import { DailyRewardsController } from '@/controllers/daily-rewards.controller';

const router = Router();

// Get user's weekly rewards (rolling 7 days)
router.get('/weekly/:userId', DailyRewardsController.getWeeklyRewards);

// Get user's rewards history
router.get('/history/:userId', DailyRewardsController.getRewardsHistory);

// Manually trigger daily rewards recording
router.post('/trigger-recording', DailyRewardsController.triggerRecording);

// Record today's rewards (for testing)
router.post('/record-today', DailyRewardsController.recordToday);

export { router as dailyRewardsRoutes };