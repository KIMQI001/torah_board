"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
const dashboard_service_1 = require("@/services/dashboard.service");
const scheduler_service_1 = require("@/services/scheduler.service");
const external_api_service_1 = require("@/services/external-api.service");
class DashboardController {
    /**
     * Get comprehensive dashboard statistics
     */
    static async getDashboardStats(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const stats = await dashboard_service_1.DashboardService.getDashboardStats(req.user.id);
            response_1.ResponseUtil.success(res, stats, 'Dashboard statistics retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting dashboard stats', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get scheduler status and information
     */
    static async getSchedulerStatus(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const status = scheduler_service_1.SchedulerService.getStatus();
            response_1.ResponseUtil.success(res, status, 'Scheduler status retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting scheduler status', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Manually trigger capacity updates for all nodes
     */
    static async triggerCapacityUpdate(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            logger_1.Logger.info('Manual capacity update triggered by user', {
                userId: req.user.id,
                walletAddress: req.user.walletAddress
            });
            const result = await scheduler_service_1.SchedulerService.triggerCapacityUpdate();
            if (result.success) {
                response_1.ResponseUtil.success(res, result.stats, result.message);
            }
            else {
                response_1.ResponseUtil.error(res, result.message);
            }
        }
        catch (error) {
            logger_1.Logger.error('Error triggering manual capacity update', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get system health status
     */
    static async getSystemHealth(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // Check various system components
            const health = {
                database: 'healthy',
                scheduler: scheduler_service_1.SchedulerService.getStatus().isRunning ? 'healthy' : 'stopped',
                externalAPIs: {
                    filecoin: 'unknown',
                    helium: 'unknown'
                },
                lastChecked: new Date().toISOString()
            };
            // Test database connection
            try {
                await database_1.prisma.$queryRaw `SELECT 1`;
            }
            catch (error) {
                health.database = 'unhealthy';
            }
            response_1.ResponseUtil.success(res, health, 'System health status retrieved');
        }
        catch (error) {
            logger_1.Logger.error('Error getting system health', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get platform-wide statistics (for admin users)
     */
    static async getPlatformStats(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // For now, return user-specific stats
            // In future, implement admin role checking and platform-wide stats
            const stats = await dashboard_service_1.DashboardService.getDashboardStats(req.user.id);
            const platformStats = {
                totalUsers: 1, // Mock data - in real implementation, count all users
                totalNodesAcrossPlatform: stats.overview.totalNodes,
                totalCapacityAcrossPlatform: stats.overview.totalCapacity,
                activeProjects: stats.overview.totalProjects,
                platformUptime: '99.9%',
                apiCallsToday: Math.floor(Math.random() * 10000) + 5000,
                lastUpdated: new Date().toISOString()
            };
            response_1.ResponseUtil.success(res, platformStats, 'Platform statistics retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting platform stats', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Get earnings summary for different time periods
     */
    static async getEarningsSummary(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { period = '30d' } = req.query;
            const userId = req.user.id;
            // Get user's nodes
            const userNodes = await database_1.prisma.userNode.findMany({
                where: { userId },
                include: {
                    project: { select: { name: true } }
                }
            });
            // Get real Filecoin earnings
            let filecoinEarnings = 0;
            const filecoinNodes = userNodes.filter(node => node.project.name.includes('Filecoin') && node.nodeId.startsWith('f0'));
            for (const node of filecoinNodes) {
                try {
                    // Always use 24h data for consistency with node display
                    const earnings = await external_api_service_1.ExternalApiService.queryFilecoinMinerEarnings(node.nodeId, '24h');
                    if (earnings) {
                        // Use daily earnings and multiply by period days for total calculation
                        let periodMultiplier = 1;
                        if (period === '7d')
                            periodMultiplier = 7;
                        else if (period === '30d')
                            periodMultiplier = 30;
                        else if (period === '90d')
                            periodMultiplier = 90;
                        else if (period === '1y')
                            periodMultiplier = 365;
                        filecoinEarnings += earnings.daily * periodMultiplier;
                    }
                }
                catch (error) {
                    logger_1.Logger.warn('Failed to get Filecoin earnings for node', {
                        nodeId: node.nodeId,
                        error: error.message
                    });
                }
            }
            // Mock data for other projects (since we don't have real APIs for them yet)
            const heliumEarnings = Math.random() * 150 + 25;
            const renderEarnings = Math.random() * 100 + 15;
            const totalEarnings = filecoinEarnings + heliumEarnings + renderEarnings;
            const totalDays = period === '24h' ? 1 : (period === '7d' ? 7 : 30);
            const averageDailyEarnings = totalEarnings / totalDays;
            const summary = {
                period,
                totalEarnings,
                averageDailyEarnings,
                topEarningProject: filecoinEarnings > heliumEarnings ? 'Filecoin Storage Network' : 'Helium Wireless Network',
                growthPercentage: Math.random() * 20 - 10, // Mock growth data
                projectedMonthlyEarnings: averageDailyEarnings * 30,
                breakdown: [
                    {
                        projectName: 'Filecoin Storage Network',
                        earnings: filecoinEarnings,
                        percentage: totalEarnings > 0 ? Math.round((filecoinEarnings / totalEarnings) * 100) : 0
                    },
                    {
                        projectName: 'Helium Wireless Network',
                        earnings: heliumEarnings,
                        percentage: totalEarnings > 0 ? Math.round((heliumEarnings / totalEarnings) * 100) : 30
                    },
                    {
                        projectName: 'Render GPU Computing Network',
                        earnings: renderEarnings,
                        percentage: totalEarnings > 0 ? Math.round((renderEarnings / totalEarnings) * 100) : 10
                    }
                ]
            };
            logger_1.Logger.info('Real Filecoin earnings calculated', {
                userId,
                filecoinNodes: filecoinNodes.length,
                filecoinEarnings,
                totalEarnings,
                period
            });
            response_1.ResponseUtil.success(res, summary, 'Earnings summary retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error getting earnings summary', {
                error: error.message,
                userId: req.user?.id
            });
            response_1.ResponseUtil.serverError(res);
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map