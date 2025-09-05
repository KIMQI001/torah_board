"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("@/utils/logger");
const external_api_service_1 = require("@/services/external-api.service");
const exchange_symbols_service_1 = require("@/services/exchange-symbols.service");
const news_feeds_service_1 = require("@/services/news-feeds.service");
const cex_announcements_service_1 = require("@/services/cex-announcements.service");
const websocket_service_1 = require("@/services/websocket.service");
const daily_rewards_service_1 = require("@/services/daily-rewards.service");
const database_1 = require("@/services/database");
class SchedulerService {
    /**
     * Initialize all scheduled tasks
     */
    static initialize() {
        if (this.isRunning) {
            logger_1.Logger.warn('Scheduler service is already running');
            return;
        }
        logger_1.Logger.info('Initializing scheduler service...');
        // Update node capacities every 10 minutes  
        this.scheduleCapacityUpdates();
        // Clean up old performance data every day at 2 AM
        this.schedulePerformanceCleanup();
        // Update token prices every 30 minutes
        this.schedulePriceUpdates();
        // Update exchange symbols every 6 hours
        this.scheduleExchangeSymbolsUpdates();
        // Update news feeds every 3 minutes
        this.scheduleNewsFeedsUpdates();
        // Update CEX announcements every 5 minutes
        this.scheduleCEXAnnouncementsUpdates();
        // Record daily rewards every day at midnight (00:00)
        this.scheduleDailyRewardsRecording();
        this.isRunning = true;
        logger_1.Logger.info('Scheduler service initialized successfully');
    }
    /**
     * Stop all scheduled tasks
     */
    static stop() {
        logger_1.Logger.info('Stopping scheduler service...');
        this.tasks.forEach((task, name) => {
            task.stop();
            logger_1.Logger.info(`Stopped scheduled task: ${name}`);
        });
        this.tasks.clear();
        this.isRunning = false;
        logger_1.Logger.info('Scheduler service stopped');
    }
    /**
     * Schedule automatic capacity updates every 10 minutes
     */
    static scheduleCapacityUpdates() {
        const task = node_cron_1.default.schedule('*/10 * * * *', async () => {
            try {
                logger_1.Logger.info('Starting scheduled capacity update...');
                // Get all users with nodes that need capacity updates OR have Filecoin nodes (for earnings update)
                const users = await database_1.prisma.user.findMany({
                    where: {
                        nodes: {
                            some: {
                                OR: [
                                    // Nodes without capacity
                                    { capacity: null },
                                    { capacity: '' },
                                    { capacity: 'Querying...' },
                                    // All Filecoin nodes (for regular earnings updates)
                                    {
                                        project: {
                                            name: {
                                                contains: 'Filecoin'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    select: { id: true, walletAddress: true }
                });
                let totalUpdated = 0;
                let totalFailed = 0;
                for (const user of users) {
                    try {
                        const results = await external_api_service_1.ExternalApiService.updateNodeCapacities(user.id);
                        totalUpdated += results.updated;
                        totalFailed += results.failed;
                        logger_1.Logger.info('Scheduled capacity update for user completed', {
                            userId: user.id,
                            walletAddress: user.walletAddress,
                            updated: results.updated,
                            failed: results.failed
                        });
                        // Add delay between users to avoid overwhelming external APIs
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    catch (error) {
                        logger_1.Logger.error('Error in scheduled capacity update for user', {
                            error: error.message,
                            userId: user.id,
                            walletAddress: user.walletAddress
                        });
                        totalFailed++;
                    }
                }
                logger_1.Logger.info('Scheduled capacity update completed (10min interval)', {
                    totalUsers: users.length,
                    totalUpdated,
                    totalFailed
                });
            }
            catch (error) {
                logger_1.Logger.error('Error in scheduled capacity update', {
                    error: error.message
                });
            }
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        task.start();
        this.tasks.set('capacity-updates', task);
        logger_1.Logger.info('Scheduled capacity updates every 10 minutes');
    }
    /**
     * Schedule cleanup of old performance data every day at 2 AM
     */
    static schedulePerformanceCleanup() {
        const task = node_cron_1.default.schedule('0 2 * * *', async () => {
            try {
                logger_1.Logger.info('Starting scheduled performance data cleanup...');
                // Delete performance records older than 30 days
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const deleteResult = await database_1.prisma.nodePerformance.deleteMany({
                    where: {
                        timestamp: {
                            lt: thirtyDaysAgo
                        }
                    }
                });
                logger_1.Logger.info('Performance data cleanup completed', {
                    deletedRecords: deleteResult.count,
                    cutoffDate: thirtyDaysAgo.toISOString()
                });
            }
            catch (error) {
                logger_1.Logger.error('Error in scheduled performance cleanup', {
                    error: error.message
                });
            }
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        task.start();
        this.tasks.set('performance-cleanup', task);
        logger_1.Logger.info('Scheduled performance cleanup daily at 2 AM UTC');
    }
    /**
     * Schedule token price updates every 30 minutes
     */
    static schedulePriceUpdates() {
        const task = node_cron_1.default.schedule('*/30 * * * *', async () => {
            try {
                logger_1.Logger.info('Starting scheduled price updates...');
                // Get all unique token symbols
                const projects = await database_1.prisma.dePINProject.findMany({
                    select: {
                        id: true,
                        tokenSymbol: true,
                        name: true
                    }
                });
                const uniqueSymbols = [...new Set(projects.map(p => p.tokenSymbol))];
                for (const symbol of uniqueSymbols) {
                    try {
                        // Simulate price update (in real implementation, call CoinGecko or similar)
                        const mockPrice = await this.fetchTokenPrice(symbol);
                        if (mockPrice > 0) {
                            await database_1.prisma.dePINProject.updateMany({
                                where: { tokenSymbol: symbol },
                                data: {
                                    tokenPrice: mockPrice,
                                    updatedAt: new Date()
                                }
                            });
                            logger_1.Logger.debug('Updated token price', {
                                symbol,
                                price: mockPrice
                            });
                        }
                    }
                    catch (error) {
                        logger_1.Logger.error('Error updating price for token', {
                            error: error.message,
                            symbol
                        });
                    }
                    // Add small delay between price updates
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                logger_1.Logger.info('Scheduled price updates completed', {
                    processedSymbols: uniqueSymbols.length
                });
            }
            catch (error) {
                logger_1.Logger.error('Error in scheduled price updates', {
                    error: error.message
                });
            }
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        task.start();
        this.tasks.set('price-updates', task);
        logger_1.Logger.info('Scheduled token price updates every 30 minutes');
    }
    /**
     * Mock function to fetch token price (replace with real API call)
     */
    static async fetchTokenPrice(symbol) {
        // In real implementation, call CoinGecko API or similar
        // For now, return a random fluctuation of ±5% from current price
        const basePrice = await database_1.prisma.dePINProject.findFirst({
            where: { tokenSymbol: symbol },
            select: { tokenPrice: true }
        });
        if (!basePrice)
            return 0;
        const fluctuation = (Math.random() - 0.5) * 0.1; // ±5% fluctuation
        const newPrice = basePrice.tokenPrice * (1 + fluctuation);
        return Math.max(0.01, parseFloat(newPrice.toFixed(4))); // Minimum price of $0.01
    }
    /**
     * Manually trigger capacity update for all nodes
     */
    static async triggerCapacityUpdate() {
        try {
            logger_1.Logger.info('Manual capacity update triggered');
            const users = await database_1.prisma.user.findMany({
                where: {
                    nodes: {
                        some: {
                            OR: [
                                // Nodes without capacity
                                { capacity: null },
                                { capacity: '' },
                                { capacity: 'Querying...' },
                                // All Filecoin nodes (for regular earnings updates)
                                {
                                    project: {
                                        name: {
                                            contains: 'Filecoin'
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                select: { id: true }
            });
            let totalUpdated = 0;
            let totalFailed = 0;
            for (const user of users) {
                const results = await external_api_service_1.ExternalApiService.updateNodeCapacities(user.id);
                totalUpdated += results.updated;
                totalFailed += results.failed;
                // Add delay to avoid overwhelming APIs
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const stats = {
                totalUsers: users.length,
                totalUpdated,
                totalFailed
            };
            logger_1.Logger.info('Manual capacity update completed', stats);
            return {
                success: true,
                message: `Capacity update completed: ${totalUpdated} updated, ${totalFailed} failed`,
                stats
            };
        }
        catch (error) {
            logger_1.Logger.error('Error in manual capacity update', {
                error: error.message
            });
            return {
                success: false,
                message: `Capacity update failed: ${error.message}`
            };
        }
    }
    /**
     * Schedule exchange symbols updates every 6 hours
     */
    static scheduleExchangeSymbolsUpdates() {
        const task = node_cron_1.default.schedule('0 */6 * * *', async () => {
            try {
                logger_1.Logger.info('Starting scheduled exchange symbols update...');
                await exchange_symbols_service_1.ExchangeSymbolsService.updateSymbolsTask();
                logger_1.Logger.info('Scheduled exchange symbols update completed');
            }
            catch (error) {
                logger_1.Logger.error('Error in scheduled exchange symbols update', {
                    error: error.message
                });
            }
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        task.start();
        this.tasks.set('exchange-symbols-update', task);
        logger_1.Logger.info('Scheduled exchange symbols updates every 6 hours');
    }
    /**
     * Manually trigger exchange symbols update
     */
    static async triggerExchangeSymbolsUpdate() {
        try {
            logger_1.Logger.info('Manual exchange symbols update triggered');
            const startTime = Date.now();
            await exchange_symbols_service_1.ExchangeSymbolsService.updateSymbolsTask();
            const endTime = Date.now();
            const totalSymbols = await database_1.prisma.exchangeSymbol.count({
                where: { status: 'TRADING' }
            });
            const stats = {
                totalSymbols,
                updateTime: `${(endTime - startTime) / 1000}s`
            };
            logger_1.Logger.info('Manual exchange symbols update completed', stats);
            return {
                success: true,
                message: `Exchange symbols update completed: ${totalSymbols} symbols updated in ${stats.updateTime}`,
                stats
            };
        }
        catch (error) {
            logger_1.Logger.error('Error in manual exchange symbols update', {
                error: error.message
            });
            return {
                success: false,
                message: `Exchange symbols update failed: ${error.message}`
            };
        }
    }
    /**
     * Schedule news feeds updates every 3 minutes
     */
    static scheduleNewsFeedsUpdates() {
        const task = node_cron_1.default.schedule('*/3 * * * *', async () => {
            try {
                logger_1.Logger.info('Starting scheduled news feeds update...');
                await news_feeds_service_1.NewsFeedsService.aggregateFeedsTask();
                logger_1.Logger.info('Scheduled news feeds update completed');
            }
            catch (error) {
                logger_1.Logger.error('Error in scheduled news feeds update', {
                    error: error.message
                });
            }
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        task.start();
        this.tasks.set('news-feeds-update', task);
        logger_1.Logger.info('Scheduled news feeds updates every 3 minutes');
    }
    /**
     * Manually trigger news feeds update
     */
    static async triggerNewsFeedsUpdate() {
        try {
            logger_1.Logger.info('Manual news feeds update triggered');
            const startTime = Date.now();
            await news_feeds_service_1.NewsFeedsService.aggregateFeedsTask();
            const endTime = Date.now();
            const totalFeeds = await database_1.prisma.newsFeed.count();
            const stats = {
                totalFeeds,
                updateTime: `${(endTime - startTime) / 1000}s`
            };
            logger_1.Logger.info('Manual news feeds update completed', stats);
            return {
                success: true,
                message: `News feeds update completed: ${totalFeeds} total feeds processed in ${stats.updateTime}`,
                stats
            };
        }
        catch (error) {
            logger_1.Logger.error('Error in manual news feeds update', {
                error: error.message
            });
            return {
                success: false,
                message: `News feeds update failed: ${error.message}`
            };
        }
    }
    /**
     * Schedule CEX announcements updates every 5 minutes
     */
    static scheduleCEXAnnouncementsUpdates() {
        const task = node_cron_1.default.schedule('*/5 * * * *', async () => {
            try {
                logger_1.Logger.info('Starting CEX announcements update task...');
                await this.updateCEXAnnouncements();
                logger_1.Logger.info('CEX announcements update task completed successfully');
            }
            catch (error) {
                logger_1.Logger.error('CEX announcements update task failed', { error });
            }
        }, {
            scheduled: true,
            name: 'cex-announcements-update'
        });
        this.tasks.set('cex-announcements-update', task);
        logger_1.Logger.info('Scheduled CEX announcements updates every 5 minutes');
    }
    /**
     * Update CEX announcements from all supported exchanges
     */
    static async updateCEXAnnouncements() {
        try {
            // Get count before update to compare
            const beforeCount = await database_1.prisma.cEXAnnouncement.count();
            // Clear cache to force fresh data
            cex_announcements_service_1.CEXAnnouncementsService.clearCache();
            // Update announcements from all exchanges in parallel
            const [binanceData, okxData, bybitData, kucoinData] = await Promise.allSettled([
                cex_announcements_service_1.CEXAnnouncementsService.getBinanceAnnouncements(),
                cex_announcements_service_1.CEXAnnouncementsService.getOKXAnnouncements(),
                cex_announcements_service_1.CEXAnnouncementsService.getBybitAnnouncements(),
                cex_announcements_service_1.CEXAnnouncementsService.getKuCoinAnnouncements()
            ]);
            // Count successful updates
            let totalUpdated = 0;
            const results = {
                binance: binanceData.status === 'fulfilled' ? binanceData.value.length : 0,
                okx: okxData.status === 'fulfilled' ? okxData.value.length : 0,
                bybit: bybitData.status === 'fulfilled' ? bybitData.value.length : 0,
                kucoin: kucoinData.status === 'fulfilled' ? kucoinData.value.length : 0,
            };
            totalUpdated = Object.values(results).reduce((sum, count) => sum + count, 0);
            // Get count after update
            const afterCount = await database_1.prisma.cEXAnnouncement.count();
            const newAnnouncementsCount = afterCount - beforeCount;
            logger_1.Logger.info(`Updated CEX announcements: ${JSON.stringify(results)} (Total: ${totalUpdated})`);
            // Broadcast update to WebSocket clients if there are new announcements
            if (newAnnouncementsCount > 0) {
                // Get the latest announcements to broadcast
                const latestAnnouncements = await cex_announcements_service_1.CEXAnnouncementsService.getAnnouncementsFromDB({
                    limit: newAnnouncementsCount
                });
                websocket_service_1.WebSocketService.broadcastCEXAnnouncements(latestAnnouncements);
                websocket_service_1.WebSocketService.broadcastAnnouncementUpdate(`发现 ${newAnnouncementsCount} 条新公告`, { newCount: newAnnouncementsCount });
                logger_1.Logger.info(`Broadcasted ${newAnnouncementsCount} new announcements via WebSocket`);
            }
            return {
                success: true,
                message: `Successfully updated ${totalUpdated} announcements`,
                data: { ...results, newCount: newAnnouncementsCount }
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to update CEX announcements', { error });
            return {
                success: false,
                message: `CEX announcements update failed: ${error.message}`
            };
        }
    }
    /**
     * Schedule daily rewards recording every day at midnight (00:00 UTC)
     */
    static scheduleDailyRewardsRecording() {
        const task = node_cron_1.default.schedule('0 0 * * *', async () => {
            try {
                logger_1.Logger.info('Starting scheduled daily rewards recording...');
                await daily_rewards_service_1.DailyRewardsService.recordDailyRewards();
                // Also cleanup old rewards (older than 30 days) weekly
                const today = new Date();
                if (today.getDay() === 0) { // Sunday
                    await daily_rewards_service_1.DailyRewardsService.cleanupOldRewards(30);
                }
                logger_1.Logger.info('Scheduled daily rewards recording completed');
            }
            catch (error) {
                logger_1.Logger.error('Error in scheduled daily rewards recording', {
                    error: error.message
                });
            }
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        task.start();
        this.tasks.set('daily-rewards-recording', task);
        logger_1.Logger.info('Scheduled daily rewards recording every day at midnight UTC');
    }
    /**
     * Manually trigger daily rewards recording
     */
    static async triggerDailyRewardsRecording() {
        try {
            logger_1.Logger.info('Manual daily rewards recording triggered');
            const startTime = Date.now();
            await daily_rewards_service_1.DailyRewardsService.recordDailyRewards();
            const endTime = Date.now();
            const today = new Date().toISOString().split('T')[0];
            const totalRecords = await database_1.prisma.dailyReward.count({
                where: { date: today }
            });
            // Get unique user count for today
            const processedUsers = await database_1.prisma.dailyReward.count({
                where: { date: today },
                distinct: ['userId']
            });
            const stats = {
                date: today,
                processedUsers,
                totalRecords,
                updateTime: `${(endTime - startTime) / 1000}s`
            };
            logger_1.Logger.info('Manual daily rewards recording completed', stats);
            return {
                success: true,
                message: `Daily rewards recording completed: ${totalRecords} records for ${processedUsers} users`,
                stats
            };
        }
        catch (error) {
            logger_1.Logger.error('Error in manual daily rewards recording', {
                error: error.message
            });
            return {
                success: false,
                message: `Daily rewards recording failed: ${error.message}`
            };
        }
    }
    /**
     * Get scheduler status and next run times
     */
    static getStatus() {
        const activeTasks = Array.from(this.tasks.entries()).map(([name, task]) => ({
            name,
            nextRun: task.getStatus() === 'scheduled' ? 'Active' : null,
            isRunning: task.getStatus() === 'scheduled'
        }));
        return {
            isRunning: this.isRunning,
            activeTasks
        };
    }
}
exports.SchedulerService = SchedulerService;
SchedulerService.isRunning = false;
SchedulerService.tasks = new Map();
//# sourceMappingURL=scheduler.service.js.map