"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceAlertsService = void 0;
const database_1 = require("@/services/database");
const logger_1 = require("@/utils/logger");
const market_data_service_1 = require("./market-data.service");
class PriceAlertsService {
    /**
     * 创建价格预警
     */
    static async createAlert(data) {
        try {
            const alert = await database_1.prisma.priceAlert.create({
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
            logger_1.Logger.info('Price alert created', { alertId: alert.id, userId: data.userId, symbol: data.symbol });
            return alert;
        }
        catch (error) {
            logger_1.Logger.error('Failed to create price alert', { error, data });
            throw error;
        }
    }
    /**
     * 获取用户的价格预警
     */
    static async getUserAlerts(userId, activeOnly = false) {
        try {
            const where = { userId };
            if (activeOnly) {
                where.isActive = true;
                where.isTriggered = false;
            }
            const alerts = await database_1.prisma.priceAlert.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });
            return alerts;
        }
        catch (error) {
            logger_1.Logger.error('Failed to get user alerts', { error, userId });
            throw error;
        }
    }
    /**
     * 更新价格预警
     */
    static async updateAlert(alertId, userId, updates) {
        try {
            // 验证用户权限
            const existingAlert = await database_1.prisma.priceAlert.findFirst({
                where: { id: alertId, userId }
            });
            if (!existingAlert) {
                throw new Error('Price alert not found or access denied');
            }
            const alert = await database_1.prisma.priceAlert.update({
                where: { id: alertId },
                data: {
                    ...updates,
                    updatedAt: new Date()
                }
            });
            logger_1.Logger.info('Price alert updated', { alertId, userId });
            return alert;
        }
        catch (error) {
            logger_1.Logger.error('Failed to update price alert', { error, alertId, userId });
            throw error;
        }
    }
    /**
     * 删除价格预警
     */
    static async deleteAlert(alertId, userId) {
        try {
            // 验证用户权限
            const existingAlert = await database_1.prisma.priceAlert.findFirst({
                where: { id: alertId, userId }
            });
            if (!existingAlert) {
                throw new Error('Price alert not found or access denied');
            }
            await database_1.prisma.priceAlert.delete({
                where: { id: alertId }
            });
            logger_1.Logger.info('Price alert deleted', { alertId, userId });
        }
        catch (error) {
            logger_1.Logger.error('Failed to delete price alert', { error, alertId, userId });
            throw error;
        }
    }
    /**
     * 检查并触发价格预警
     */
    static async checkAndTriggerAlerts() {
        try {
            // 获取所有活跃且未触发的预警
            const activeAlerts = await database_1.prisma.priceAlert.findMany({
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
            const marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData(symbols);
            const triggeredAlerts = [];
            for (const alert of activeAlerts) {
                const symbolData = marketData.find(data => data.symbol === alert.symbol && data.exchange === alert.exchange);
                if (!symbolData) {
                    logger_1.Logger.warn('No market data found for alert', { alertId: alert.id, symbol: alert.symbol });
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
                    await database_1.prisma.priceAlert.update({
                        where: { id: alert.id },
                        data: {
                            isTriggered: true,
                            triggeredAt: new Date()
                        }
                    });
                    triggeredAlerts.push(alert.id);
                    // 这里可以发送通知（邮件、推送等）
                    await this.sendAlertNotification(alert, currentPrice);
                }
            }
            if (triggeredAlerts.length > 0) {
                logger_1.Logger.info(`Triggered ${triggeredAlerts.length} price alerts`, { triggeredAlerts });
            }
        }
        catch (error) {
            logger_1.Logger.error('Failed to check and trigger alerts', { error });
        }
    }
    /**
     * 发送预警通知
     */
    static async sendAlertNotification(alert, currentPrice) {
        try {
            // 这里实现通知发送逻辑
            // 可以是邮件、短信、推送通知等
            logger_1.Logger.info('Price alert triggered', {
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
        }
        catch (error) {
            logger_1.Logger.error('Failed to send alert notification', { error, alertId: alert.id });
        }
    }
    /**
     * 获取特定交易对的预警统计
     */
    static async getSymbolAlertStats(symbol) {
        try {
            const alerts = await database_1.prisma.priceAlert.findMany({
                where: { symbol: symbol.toUpperCase() }
            });
            const total = alerts.length;
            const active = alerts.filter(a => a.isActive && !a.isTriggered).length;
            const triggered = alerts.filter(a => a.isTriggered).length;
            const averageTargetPrice = alerts.length > 0
                ? alerts.reduce((sum, alert) => sum + alert.targetPrice, 0) / alerts.length
                : 0;
            const above = alerts.filter(a => a.condition === 'above' || a.condition === 'crosses_above').length;
            const below = alerts.filter(a => a.condition === 'below' || a.condition === 'crosses_below').length;
            return {
                total,
                active,
                triggered,
                averageTargetPrice,
                priceRanges: { above, below }
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to get symbol alert stats', { error, symbol });
            throw error;
        }
    }
    /**
     * 批量创建价格预警
     */
    static async createBulkAlerts(alerts) {
        try {
            const createdAlerts = await database_1.prisma.priceAlert.createMany({
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
            logger_1.Logger.info(`Created ${createdAlerts.count} price alerts in bulk`);
            // 返回创建的预警（需要重新查询以获取ID）
            const userIds = [...new Set(alerts.map(a => a.userId))];
            const result = await this.getUserAlerts(userIds[0], true);
            return result.slice(-createdAlerts.count);
        }
        catch (error) {
            logger_1.Logger.error('Failed to create bulk price alerts', { error });
            throw error;
        }
    }
    /**
     * 清理已触发的预警（可选择保留多长时间）
     */
    static async cleanupTriggeredAlerts(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = await database_1.prisma.priceAlert.deleteMany({
                where: {
                    isTriggered: true,
                    triggeredAt: {
                        lt: cutoffDate
                    }
                }
            });
            logger_1.Logger.info(`Cleaned up ${result.count} triggered price alerts older than ${daysToKeep} days`);
            return result.count;
        }
        catch (error) {
            logger_1.Logger.error('Failed to cleanup triggered alerts', { error });
            throw error;
        }
    }
}
exports.PriceAlertsService = PriceAlertsService;
//# sourceMappingURL=price-alerts.service.js.map