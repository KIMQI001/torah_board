import { Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { DashboardService } from '@/services/dashboard.service';
import { SchedulerService } from '@/services/scheduler.service';
import { AuthenticatedRequest } from '@/types';

export class DashboardController {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const stats = await DashboardService.getDashboardStats(req.user.id);

      ResponseUtil.success(res, stats, 'Dashboard statistics retrieved successfully');

    } catch (error) {
      Logger.error('Error getting dashboard stats', {
        error: error.message,
        userId: req.user?.id
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Get scheduler status and information
   */
  static async getSchedulerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const status = SchedulerService.getStatus();

      ResponseUtil.success(res, status, 'Scheduler status retrieved successfully');

    } catch (error) {
      Logger.error('Error getting scheduler status', {
        error: error.message,
        userId: req.user?.id
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Manually trigger capacity updates for all nodes
   */
  static async triggerCapacityUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      Logger.info('Manual capacity update triggered by user', {
        userId: req.user.id,
        walletAddress: req.user.walletAddress
      });

      const result = await SchedulerService.triggerCapacityUpdate();

      if (result.success) {
        ResponseUtil.success(res, result.stats, result.message);
      } else {
        ResponseUtil.error(res, result.message);
      }

    } catch (error) {
      Logger.error('Error triggering manual capacity update', {
        error: error.message,
        userId: req.user?.id
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Get system health status
   */
  static async getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // Check various system components
      const health = {
        database: 'healthy',
        scheduler: SchedulerService.getStatus().isRunning ? 'healthy' : 'stopped',
        externalAPIs: {
          filecoin: 'unknown',
          helium: 'unknown'
        },
        lastChecked: new Date().toISOString()
      };

      // Test database connection
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        health.database = 'unhealthy';
      }

      ResponseUtil.success(res, health, 'System health status retrieved');

    } catch (error) {
      Logger.error('Error getting system health', {
        error: error.message,
        userId: req.user?.id
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Get platform-wide statistics (for admin users)
   */
  static async getPlatformStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // For now, return user-specific stats
      // In future, implement admin role checking and platform-wide stats
      const stats = await DashboardService.getDashboardStats(req.user.id);

      const platformStats = {
        totalUsers: 1, // Mock data - in real implementation, count all users
        totalNodesAcrossPlatform: stats.overview.totalNodes,
        totalCapacityAcrossPlatform: stats.overview.totalCapacity,
        activeProjects: stats.overview.totalProjects,
        platformUptime: '99.9%',
        apiCallsToday: Math.floor(Math.random() * 10000) + 5000,
        lastUpdated: new Date().toISOString()
      };

      ResponseUtil.success(res, platformStats, 'Platform statistics retrieved successfully');

    } catch (error) {
      Logger.error('Error getting platform stats', {
        error: error.message,
        userId: req.user?.id
      });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Get earnings summary for different time periods
   */
  static async getEarningsSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { period = '30d' } = req.query;

      // For now, return mock earnings data
      // In real implementation, calculate based on actual node performance and rewards
      const summary = {
        period,
        totalEarnings: Math.random() * 500 + 100,
        averageDailyEarnings: Math.random() * 20 + 5,
        topEarningProject: 'Filecoin Storage Network',
        growthPercentage: Math.random() * 20 - 10, // -10% to +10%
        projectedMonthlyEarnings: Math.random() * 600 + 200,
        breakdown: [
          {
            projectName: 'Filecoin Storage Network',
            earnings: Math.random() * 300 + 50,
            percentage: 60
          },
          {
            projectName: 'Helium Wireless Network',
            earnings: Math.random() * 150 + 25,
            percentage: 30
          },
          {
            projectName: 'Render GPU Computing Network',
            earnings: Math.random() * 100 + 15,
            percentage: 10
          }
        ]
      };

      ResponseUtil.success(res, summary, 'Earnings summary retrieved successfully');

    } catch (error) {
      Logger.error('Error getting earnings summary', {
        error: error.message,
        userId: req.user?.id
      });
      ResponseUtil.serverError(res);
    }
  }
}