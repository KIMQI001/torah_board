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
export declare class PriceAlertsService {
    /**
     * 创建价格预警
     */
    static createAlert(data: CreatePriceAlertData): Promise<PriceAlert>;
    /**
     * 获取用户的价格预警
     */
    static getUserAlerts(userId: string, activeOnly?: boolean): Promise<PriceAlert[]>;
    /**
     * 更新价格预警
     */
    static updateAlert(alertId: string, userId: string, updates: UpdatePriceAlertData): Promise<PriceAlert>;
    /**
     * 删除价格预警
     */
    static deleteAlert(alertId: string, userId: string): Promise<void>;
    /**
     * 检查并触发价格预警
     */
    static checkAndTriggerAlerts(): Promise<void>;
    /**
     * 发送预警通知
     */
    private static sendAlertNotification;
    /**
     * 获取特定交易对的预警统计
     */
    static getSymbolAlertStats(symbol: string): Promise<{
        total: number;
        active: number;
        triggered: number;
        averageTargetPrice: number;
        priceRanges: {
            above: number;
            below: number;
        };
    }>;
    /**
     * 批量创建价格预警
     */
    static createBulkAlerts(alerts: CreatePriceAlertData[]): Promise<PriceAlert[]>;
    /**
     * 清理已触发的预警（可选择保留多长时间）
     */
    static cleanupTriggeredAlerts(daysToKeep?: number): Promise<number>;
}
//# sourceMappingURL=price-alerts.service.d.ts.map