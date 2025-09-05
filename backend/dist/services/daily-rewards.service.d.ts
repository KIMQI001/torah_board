/**
 * Daily Rewards Service - 每日奖励记录服务
 */
export declare class DailyRewardsService {
    /**
     * 记录当日所有用户的奖励到数据库
     */
    static recordDailyRewards(): Promise<void>;
    /**
     * 计算用户当日总奖励
     */
    private static calculateUserDailyRewards;
    /**
     * 获取用户过去N天的奖励记录
     */
    static getUserRewardsHistory(userId: string, days?: number): Promise<any[]>;
    /**
     * 计算用户过去N天的总奖励（滚动窗口）
     */
    static calculateRollingRewards(userId: string, days?: number): Promise<{
        totalUSD: number;
        breakdown: Record<string, {
            amount: number;
            usd: number;
        }>;
        averageDaily: number;
    }>;
    /**
     * 清理旧的奖励记录（保留指定天数）
     */
    static cleanupOldRewards(keepDays?: number): Promise<void>;
    /**
     * 获取代币价格 (使用CoinGecko API)
     */
    private static getTokenPrices;
}
//# sourceMappingURL=daily-rewards.service.d.ts.map