import cron from 'node-cron';
import { Logger } from '@/utils/logger';
import { ExternalApiService } from '@/services/external-api.service';
import { ExchangeSymbolsService } from '@/services/exchange-symbols.service';
import { NewsFeedsService } from '@/services/news-feeds.service';
import { CEXAnnouncementsService } from '@/services/cex-announcements.service';
import { WebSocketService } from '@/services/websocket.service';
import { prisma } from '@/services/database';

export class SchedulerService {
  private static isRunning = false;
  private static tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all scheduled tasks
   */
  static initialize(): void {
    if (this.isRunning) {
      Logger.warn('Scheduler service is already running');
      return;
    }

    Logger.info('Initializing scheduler service...');

    // Update node capacities every 4 hours
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

    this.isRunning = true;
    Logger.info('Scheduler service initialized successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  static stop(): void {
    Logger.info('Stopping scheduler service...');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      Logger.info(`Stopped scheduled task: ${name}`);
    });

    this.tasks.clear();
    this.isRunning = false;
    Logger.info('Scheduler service stopped');
  }

  /**
   * Schedule automatic capacity updates every 4 hours
   */
  private static scheduleCapacityUpdates(): void {
    const task = cron.schedule('0 */4 * * *', async () => {
      try {
        Logger.info('Starting scheduled capacity update...');
        
        // Get all users with nodes that need capacity updates
        const users = await prisma.user.findMany({
          where: {
            nodes: {
              some: {
                OR: [
                  { capacity: null },
                  { capacity: '' },
                  { capacity: 'Querying...' }
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
            const results = await ExternalApiService.updateNodeCapacities(user.id);
            totalUpdated += results.updated;
            totalFailed += results.failed;

            Logger.info('Scheduled capacity update for user completed', {
              userId: user.id,
              walletAddress: user.walletAddress,
              updated: results.updated,
              failed: results.failed
            });

            // Add delay between users to avoid overwhelming external APIs
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (error) {
            Logger.error('Error in scheduled capacity update for user', {
              error: error.message,
              userId: user.id,
              walletAddress: user.walletAddress
            });
            totalFailed++;
          }
        }

        Logger.info('Scheduled capacity update completed', {
          totalUsers: users.length,
          totalUpdated,
          totalFailed
        });

      } catch (error) {
        Logger.error('Error in scheduled capacity update', {
          error: error.message
        });
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    task.start();
    this.tasks.set('capacity-updates', task);
    Logger.info('Scheduled capacity updates every 4 hours');
  }

  /**
   * Schedule cleanup of old performance data every day at 2 AM
   */
  private static schedulePerformanceCleanup(): void {
    const task = cron.schedule('0 2 * * *', async () => {
      try {
        Logger.info('Starting scheduled performance data cleanup...');

        // Delete performance records older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const deleteResult = await prisma.nodePerformance.deleteMany({
          where: {
            timestamp: {
              lt: thirtyDaysAgo
            }
          }
        });

        Logger.info('Performance data cleanup completed', {
          deletedRecords: deleteResult.count,
          cutoffDate: thirtyDaysAgo.toISOString()
        });

      } catch (error) {
        Logger.error('Error in scheduled performance cleanup', {
          error: error.message
        });
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    task.start();
    this.tasks.set('performance-cleanup', task);
    Logger.info('Scheduled performance cleanup daily at 2 AM UTC');
  }

  /**
   * Schedule token price updates every 30 minutes
   */
  private static schedulePriceUpdates(): void {
    const task = cron.schedule('*/30 * * * *', async () => {
      try {
        Logger.info('Starting scheduled price updates...');

        // Get all unique token symbols
        const projects = await prisma.dePINProject.findMany({
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
              await prisma.dePINProject.updateMany({
                where: { tokenSymbol: symbol },
                data: {
                  tokenPrice: mockPrice,
                  updatedAt: new Date()
                }
              });

              Logger.debug('Updated token price', {
                symbol,
                price: mockPrice
              });
            }

          } catch (error) {
            Logger.error('Error updating price for token', {
              error: error.message,
              symbol
            });
          }

          // Add small delay between price updates
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        Logger.info('Scheduled price updates completed', {
          processedSymbols: uniqueSymbols.length
        });

      } catch (error) {
        Logger.error('Error in scheduled price updates', {
          error: error.message
        });
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    task.start();
    this.tasks.set('price-updates', task);
    Logger.info('Scheduled token price updates every 30 minutes');
  }

  /**
   * Mock function to fetch token price (replace with real API call)
   */
  private static async fetchTokenPrice(symbol: string): Promise<number> {
    // In real implementation, call CoinGecko API or similar
    // For now, return a random fluctuation of ±5% from current price
    
    const basePrice = await prisma.dePINProject.findFirst({
      where: { tokenSymbol: symbol },
      select: { tokenPrice: true }
    });

    if (!basePrice) return 0;

    const fluctuation = (Math.random() - 0.5) * 0.1; // ±5% fluctuation
    const newPrice = basePrice.tokenPrice * (1 + fluctuation);
    
    return Math.max(0.01, parseFloat(newPrice.toFixed(4))); // Minimum price of $0.01
  }

  /**
   * Manually trigger capacity update for all nodes
   */
  static async triggerCapacityUpdate(): Promise<{
    success: boolean;
    message: string;
    stats?: {
      totalUsers: number;
      totalUpdated: number;
      totalFailed: number;
    };
  }> {
    try {
      Logger.info('Manual capacity update triggered');

      const users = await prisma.user.findMany({
        where: {
          nodes: {
            some: {
              OR: [
                { capacity: null },
                { capacity: '' },
                { capacity: 'Querying...' }
              ]
            }
          }
        },
        select: { id: true }
      });

      let totalUpdated = 0;
      let totalFailed = 0;

      for (const user of users) {
        const results = await ExternalApiService.updateNodeCapacities(user.id);
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

      Logger.info('Manual capacity update completed', stats);

      return {
        success: true,
        message: `Capacity update completed: ${totalUpdated} updated, ${totalFailed} failed`,
        stats
      };

    } catch (error) {
      Logger.error('Error in manual capacity update', {
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
  private static scheduleExchangeSymbolsUpdates(): void {
    const task = cron.schedule('0 */6 * * *', async () => {
      try {
        Logger.info('Starting scheduled exchange symbols update...');
        
        await ExchangeSymbolsService.updateSymbolsTask();
        
        Logger.info('Scheduled exchange symbols update completed');
      } catch (error) {
        Logger.error('Error in scheduled exchange symbols update', {
          error: error.message
        });
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    task.start();
    this.tasks.set('exchange-symbols-update', task);
    Logger.info('Scheduled exchange symbols updates every 6 hours');
  }

  /**
   * Manually trigger exchange symbols update
   */
  static async triggerExchangeSymbolsUpdate(): Promise<{
    success: boolean;
    message: string;
    stats?: {
      totalSymbols: number;
      updateTime: string;
    };
  }> {
    try {
      Logger.info('Manual exchange symbols update triggered');

      const startTime = Date.now();
      await ExchangeSymbolsService.updateSymbolsTask();
      const endTime = Date.now();

      const totalSymbols = await prisma.exchangeSymbol.count({
        where: { status: 'TRADING' }
      });

      const stats = {
        totalSymbols,
        updateTime: `${(endTime - startTime) / 1000}s`
      };

      Logger.info('Manual exchange symbols update completed', stats);

      return {
        success: true,
        message: `Exchange symbols update completed: ${totalSymbols} symbols updated in ${stats.updateTime}`,
        stats
      };

    } catch (error) {
      Logger.error('Error in manual exchange symbols update', {
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
  private static scheduleNewsFeedsUpdates(): void {
    const task = cron.schedule('*/3 * * * *', async () => {
      try {
        Logger.info('Starting scheduled news feeds update...');
        
        await NewsFeedsService.aggregateFeedsTask();
        
        Logger.info('Scheduled news feeds update completed');
      } catch (error) {
        Logger.error('Error in scheduled news feeds update', {
          error: error.message
        });
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    task.start();
    this.tasks.set('news-feeds-update', task);
    Logger.info('Scheduled news feeds updates every 3 minutes');
  }

  /**
   * Manually trigger news feeds update
   */
  static async triggerNewsFeedsUpdate(): Promise<{
    success: boolean;
    message: string;
    stats?: {
      totalFeeds: number;
      updateTime: string;
    };
  }> {
    try {
      Logger.info('Manual news feeds update triggered');

      const startTime = Date.now();
      await NewsFeedsService.aggregateFeedsTask();
      const endTime = Date.now();

      const totalFeeds = await prisma.newsFeed.count();

      const stats = {
        totalFeeds,
        updateTime: `${(endTime - startTime) / 1000}s`
      };

      Logger.info('Manual news feeds update completed', stats);

      return {
        success: true,
        message: `News feeds update completed: ${totalFeeds} total feeds processed in ${stats.updateTime}`,
        stats
      };

    } catch (error) {
      Logger.error('Error in manual news feeds update', {
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
  private static scheduleCEXAnnouncementsUpdates(): void {
    const task = cron.schedule('*/5 * * * *', async () => {
      try {
        Logger.info('Starting CEX announcements update task...');
        await this.updateCEXAnnouncements();
        Logger.info('CEX announcements update task completed successfully');
      } catch (error) {
        Logger.error('CEX announcements update task failed', { error });
      }
    }, {
      scheduled: true,
      name: 'cex-announcements-update'
    });

    this.tasks.set('cex-announcements-update', task);
    Logger.info('Scheduled CEX announcements updates every 5 minutes');
  }

  /**
   * Update CEX announcements from all supported exchanges
   */
  private static async updateCEXAnnouncements(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      // Get count before update to compare
      const beforeCount = await prisma.cEXAnnouncement.count();
      
      // Clear cache to force fresh data
      CEXAnnouncementsService.clearCache();

      // Update announcements from all exchanges in parallel
      const [binanceData, okxData, bybitData, kucoinData] = await Promise.allSettled([
        CEXAnnouncementsService.getBinanceAnnouncements(),
        CEXAnnouncementsService.getOKXAnnouncements(),
        CEXAnnouncementsService.getBybitAnnouncements(),
        CEXAnnouncementsService.getKuCoinAnnouncements()
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
      const afterCount = await prisma.cEXAnnouncement.count();
      const newAnnouncementsCount = afterCount - beforeCount;

      Logger.info(`Updated CEX announcements: ${JSON.stringify(results)} (Total: ${totalUpdated})`);
      
      // Broadcast update to WebSocket clients if there are new announcements
      if (newAnnouncementsCount > 0) {
        // Get the latest announcements to broadcast
        const latestAnnouncements = await CEXAnnouncementsService.getAnnouncementsFromDB({
          limit: newAnnouncementsCount
        });
        
        WebSocketService.broadcastCEXAnnouncements(latestAnnouncements);
        WebSocketService.broadcastAnnouncementUpdate(
          `发现 ${newAnnouncementsCount} 条新公告`, 
          { newCount: newAnnouncementsCount }
        );
        
        Logger.info(`Broadcasted ${newAnnouncementsCount} new announcements via WebSocket`);
      }

      return {
        success: true,
        message: `Successfully updated ${totalUpdated} announcements`,
        data: { ...results, newCount: newAnnouncementsCount }
      };
    } catch (error) {
      Logger.error('Failed to update CEX announcements', { error });
      return {
        success: false,
        message: `CEX announcements update failed: ${error.message}`
      };
    }
  }

  /**
   * Get scheduler status and next run times
   */
  static getStatus(): {
    isRunning: boolean;
    activeTasks: Array<{
      name: string;
      nextRun: string | null;
      isRunning: boolean;
    }>;
  } {
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