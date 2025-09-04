export interface NewsFeedItem {
    id: string;
    title: string;
    content: string;
    summary?: string;
    source: 'cex' | 'onchain' | 'social' | 'defi';
    sourceUrl?: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
    exchange?: string;
    symbols: string[];
    tags: string[];
    metadata?: Record<string, any>;
    isHot: boolean;
    isVerified: boolean;
    publishTime: Date;
    createdAt: Date;
}
export interface FeedAggregationFilter {
    sources?: string[];
    categories?: string[];
    importance?: 'high' | 'medium' | 'low';
    symbols?: string[];
    exchanges?: string[];
    isHot?: boolean;
    limit?: number;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
}
export declare class NewsFeedsService {
    private static readonly CACHE_TTL;
    private static cache;
    /**
     * 将CEX公告转换为统一的快讯格式
     */
    private static convertCEXAnnouncementToFeed;
    /**
     * 将链上数据转换为统一的快讯格式
     */
    private static convertOnChainToFeed;
    /**
     * 生成区块链浏览器URL
     */
    private static generateExplorerUrl;
    /**
     * 映射链上事件类型到快讯分类
     */
    private static mapOnChainEventToCategory;
    /**
     * 从Lookonchain获取真实快讯数据
     */
    private static fetchLookonchainFeeds;
    /**
     * 将Lookonchain数据转换为统一格式
     */
    private static convertLookonchainToFeeds;
    /**
     * 从文本中提取代币符号
     */
    private static extractSymbolsFromText;
    /**
     * 聚合所有来源的快讯数据
     */
    static aggregateFeeds(filter?: FeedAggregationFilter): Promise<NewsFeedItem[]>;
    /**
     * 应用过滤器
     */
    private static applyFilters;
    /**
     * 保存快讯到数据库
     */
    static saveFeedsToDatabase(feeds: NewsFeedItem[]): Promise<void>;
    /**
     * 从数据库获取快讯
     */
    static getFeedsFromDatabase(filter?: FeedAggregationFilter): Promise<NewsFeedItem[]>;
    /**
     * 获取热门快讯
     */
    static getHotFeeds(limit?: number): Promise<NewsFeedItem[]>;
    /**
     * 获取特定交易对相关快讯
     */
    static getSymbolRelatedFeeds(symbol: string, limit?: number): Promise<NewsFeedItem[]>;
    /**
     * 获取高重要性快讯
     */
    static getHighImportanceFeeds(limit?: number): Promise<NewsFeedItem[]>;
    /**
     * 定期聚合和保存快讯任务
     */
    static aggregateFeedsTask(): Promise<void>;
    /**
     * 清除过期缓存
     */
    static clearExpiredCache(): void;
    /**
     * 清理旧快讯
     */
    static cleanupOldFeeds(daysToKeep?: number): Promise<void>;
}
//# sourceMappingURL=news-feeds.service.d.ts.map