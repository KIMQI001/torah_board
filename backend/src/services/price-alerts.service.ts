import { prisma } from '@/services/database';
import { Logger } from '@/utils/logger';
import { MarketDataService } from './market-data.service';

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  exchange: string;
  message?: string;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePriceAlertData {
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  exchange: string;
  message?: string;
}

export interface UpdatePriceAlertData {
  targetPrice?: number;
  condition?: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  message?: string;
  isActive?: boolean;
}

export class PriceAlertsService {
  /**
   * 创建价格预警
   */
  static async createAlert(data: CreatePriceAlertData): Promise<PriceAlert> {
    try {
      const alert = await prisma.priceAlert.create({
        data: {
          userId: data.userId,
          symbol: data.symbol.toUpperCase(),
          targetPrice: data.targetPrice,
          condition: data.condition,
          exchange: data.exchange.toLowerCase(),
          message: data.message,
          isActive: true,
          isTriggered: false
        }
      });

      Logger.info('Price alert created', { alertId: alert.id, userId: data.userId, symbol: data.symbol });
      return alert as PriceAlert;
    } catch (error) {
      Logger.error('Failed to create price alert', { error, data });
      throw error;
    }
  }

  /**
   * 获取用户的价格预警
   */
  static async getUserAlerts(userId: string, activeOnly = false): Promise<PriceAlert[]> {
    try {
      const where: any = { userId };
      
      if (activeOnly) {
        where.isActive = true;
        where.isTriggered = false;
      }

      const alerts = await prisma.priceAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return alerts as PriceAlert[];
    } catch (error) {
      Logger.error('Failed to get user alerts', { error, userId });
      throw error;
    }
  }

  /**
   * 更新价格预警
   */
  static async updateAlert(alertId: string, userId: string, updates: UpdatePriceAlertData): Promise<PriceAlert> {
    try {
      // 验证用户权限
      const existingAlert = await prisma.priceAlert.findFirst({
        where: { id: alertId, userId }
      });

      if (!existingAlert) {
        throw new Error('Price alert not found or access denied');
      }

      const alert = await prisma.priceAlert.update({
        where: { id: alertId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      Logger.info('Price alert updated', { alertId, userId });
      return alert as PriceAlert;
    } catch (error) {
      Logger.error('Failed to update price alert', { error, alertId, userId });
      throw error;
    }
  }

  /**
   * 删除价格预警
   */
  static async deleteAlert(alertId: string, userId: string): Promise<void> {
    try {
      // 验证用户权限
      const existingAlert = await prisma.priceAlert.findFirst({
        where: { id: alertId, userId }
      });

      if (!existingAlert) {
        throw new Error('Price alert not found or access denied');
      }

      await prisma.priceAlert.delete({
        where: { id: alertId }
      });

      Logger.info('Price alert deleted', { alertId, userId });
    } catch (error) {
      Logger.error('Failed to delete price alert', { error, alertId, userId });
      throw error;
    }
  }

  /**
   * 检查并触发价格预警
   */
  static async checkAndTriggerAlerts(): Promise<void> {
    try {
      // 获取所有活跃且未触发的预警
      const activeAlerts = await prisma.priceAlert.findMany({
        where: {
          isActive: true,
          isTriggered: false
        }
      });

      if (activeAlerts.length === 0) {
        return;
      }

      // 获取所有需要的交易对的市场数据
      const symbols = [...new Set(activeAlerts.map(alert => alert.symbol))];
      const marketData = await MarketDataService.getAggregatedMarketData(symbols);

      const triggeredAlerts: string[] = [];

      for (const alert of activeAlerts) {
        const symbolData = marketData.find(data => 
          data.symbol === alert.symbol && data.exchange === alert.exchange
        );

        if (!symbolData) {
          Logger.warn('No market data found for alert', { alertId: alert.id, symbol: alert.symbol });
          continue;
        }

        const currentPrice = symbolData.price;
        let shouldTrigger = false;

        switch (alert.condition) {
          case 'above':
            shouldTrigger = currentPrice >= alert.targetPrice;
            break;
          case 'below':
            shouldTrigger = currentPrice <= alert.targetPrice;
            break;
          case 'crosses_above':
            // 需要历史价格来判断是否"穿越"
            // 这里简化为当前价格高于目标价格
            shouldTrigger = currentPrice >= alert.targetPrice;
            break;
          case 'crosses_below':
            // 需要历史价格来判断是否"穿越"
            // 这里简化为当前价格低于目标价格
            shouldTrigger = currentPrice <= alert.targetPrice;
            break;
        }

        if (shouldTrigger) {
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: {
              isTriggered: true,
              triggeredAt: new Date()
            }
          });

          triggeredAlerts.push(alert.id);

          // 这里可以发送通知（邮件、推送等）
          await this.sendAlertNotification(alert as PriceAlert, currentPrice);
        }
      }

      if (triggeredAlerts.length > 0) {
        Logger.info(`Triggered ${triggeredAlerts.length} price alerts`, { triggeredAlerts });
      }
    } catch (error) {
      Logger.error('Failed to check and trigger alerts', { error });
    }
  }

  /**
   * 发送预警通知
   */
  private static async sendAlertNotification(alert: PriceAlert, currentPrice: number): Promise<void> {
    try {
      // 这里实现通知发送逻辑
      // 可以是邮件、短信、推送通知等
      Logger.info('Price alert triggered', {
        alertId: alert.id,
        userId: alert.userId,
        symbol: alert.symbol,
        targetPrice: alert.targetPrice,
        currentPrice,
        condition: alert.condition
      });

      // TODO: 实现实际的通知发送
      // 例如：
      // - 发送邮件
      // - 发送推送通知
      // - 记录到通知表
      
    } catch (error) {
      Logger.error('Failed to send alert notification', { error, alertId: alert.id });
    }
  }

  /**
   * 获取特定交易对的预警统计
   */
  static async getSymbolAlertStats(symbol: string): Promise<{
    total: number;
    active: number;
    triggered: number;
    averageTargetPrice: number;
    priceRanges: {
      above: number;
      below: number;
    };
  }> {
    try {
      const alerts = await prisma.priceAlert.findMany({
        where: { symbol: symbol.toUpperCase() }
      });

      const total = alerts.length;
      const active = alerts.filter(a => a.isActive && !a.isTriggered).length;
      const triggered = alerts.filter(a => a.isTriggered).length;
      
      const averageTargetPrice = alerts.length > 0 
        ? alerts.reduce((sum, alert) => sum + alert.targetPrice, 0) / alerts.length 
        : 0;

      const above = alerts.filter(a => 
        a.condition === 'above' || a.condition === 'crosses_above'
      ).length;
      
      const below = alerts.filter(a => 
        a.condition === 'below' || a.condition === 'crosses_below'
      ).length;

      return {
        total,
        active,
        triggered,
        averageTargetPrice,
        priceRanges: { above, below }
      };
    } catch (error) {
      Logger.error('Failed to get symbol alert stats', { error, symbol });
      throw error;
    }
  }

  /**
   * 批量创建价格预警
   */
  static async createBulkAlerts(alerts: CreatePriceAlertData[]): Promise<PriceAlert[]> {
    try {
      const createdAlerts = await prisma.priceAlert.createMany({
        data: alerts.map(alert => ({
          userId: alert.userId,
          symbol: alert.symbol.toUpperCase(),
          targetPrice: alert.targetPrice,
          condition: alert.condition,
          exchange: alert.exchange.toLowerCase(),
          message: alert.message,
          isActive: true,
          isTriggered: false
        }))
      });

      Logger.info(`Created ${createdAlerts.count} price alerts in bulk`);

      // 返回创建的预警（需要重新查询以获取ID）
      const userIds = [...new Set(alerts.map(a => a.userId))];
      const result = await this.getUserAlerts(userIds[0], true);
      
      return result.slice(-createdAlerts.count);
    } catch (error) {
      Logger.error('Failed to create bulk price alerts', { error });
      throw error;
    }
  }

  /**
   * 清理已触发的预警（可选择保留多长时间）
   */
  static async cleanupTriggeredAlerts(daysToKeep = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.priceAlert.deleteMany({
        where: {
          isTriggered: true,
          triggeredAt: {
            lt: cutoffDate
          }
        }
      });

      Logger.info(`Cleaned up ${result.count} triggered price alerts older than ${daysToKeep} days`);
      return result.count;
    } catch (error) {
      Logger.error('Failed to cleanup triggered alerts', { error });
      throw error;
    }
  }
}