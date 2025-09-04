export interface OnChainEvent {
    transactionHash: string;
    blockNumber: bigint;
    blockchain: string;
    eventType: string;
    title: string;
    description: string;
    amount?: string;
    tokenSymbol?: string;
    tokenAddress?: string;
    fromAddress?: string;
    toAddress?: string;
    dexName?: string;
    nftCollection?: string;
    value?: number;
    gasUsed?: string;
    gasPrice?: string;
    metadata?: Record<string, any>;
    isAlert: boolean;
    timestamp: Date;
}
export interface FeedFilter {
    blockchain?: string;
    eventType?: string;
    minValue?: number;
    tokenSymbol?: string;
    alertsOnly?: boolean;
    limit?: number;
    offset?: number;
}
export declare class OnChainFeedsService {
    private static readonly WHALE_THRESHOLD;
    private static readonly LARGE_TRANSFER_THRESHOLD;
    /**
     * 生成模拟链上数据快讯（类似Lookonchain）
     */
    static generateMockOnChainFeeds(): Promise<OnChainEvent[]>;
    /**
     * 保存链上数据到数据库
     */
    static saveOnChainFeeds(feeds: OnChainEvent[]): Promise<void>;
    /**
     * 获取链上数据快讯
     */
    static getOnChainFeeds(filter?: FeedFilter): Promise<any[]>;
    /**
     * 获取警报级别的链上事件
     */
    static getAlertFeeds(): Promise<any[]>;
    /**
     * 获取特定代币相关的链上事件
     */
    static getTokenRelatedFeeds(tokenSymbol: string): Promise<any[]>;
    /**
     * 获取巨鲸活动
     */
    static getWhaleActivity(): Promise<any[]>;
    /**
     * 定期更新链上数据任务
     */
    static updateOnChainFeedsTask(): Promise<void>;
    /**
     * 清理旧的链上数据
     */
    static cleanupOldFeeds(daysToKeep?: number): Promise<void>;
}
//# sourceMappingURL=onchain-feeds.service.d.ts.map