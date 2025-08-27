import { Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { DashboardService } from '@/services/dashboard.service';
import { SchedulerService } from '@/services/scheduler.service';
import { ExternalApiService } from '@/services/external-api.service';
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

      const { period = '30d' } = req.query as { period?: '24h' | '7d' | '30d' };
      const userId = req.user.id;

      // Get user's nodes
      const userNodes = await prisma.userNode.findMany({
        where: { userId },
        include: {
          project: { select: { name: true } }
        }
      });

      // Get real Filecoin earnings
      let filecoinEarnings = 0;
      const filecoinNodes = userNodes.filter(node => 
        node.project.name.includes('Filecoin') && node.nodeId.startsWith('f0')
      );

      for (const node of filecoinNodes) {
        try {
          // Always use 24h data for consistency with node display
          const earnings = await ExternalApiService.queryFilecoinMinerEarnings(node.nodeId, '24h');
          if (earnings) {
            // Use daily earnings and multiply by period days for total calculation
            let periodMultiplier = 1;
            if (period === '7d') periodMultiplier = 7;
            else if (period === '30d') periodMultiplier = 30;
            else if (period === '90d') periodMultiplier = 90;
            else if (period === '1y') periodMultiplier = 365;
            
            filecoinEarnings += earnings.daily * periodMultiplier;
          }
        } catch (error) {
          Logger.warn('Failed to get Filecoin earnings for node', { 
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

      Logger.info('Real Filecoin earnings calculated', {
        userId,
        filecoinNodes: filecoinNodes.length,
        filecoinEarnings,
        totalEarnings,
        period
      });

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