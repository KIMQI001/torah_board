import { ExchangeAnnouncement } from './market-data.service';
export interface AnnouncementFilter {
    exchange?: string;
    category?: string;
    importance?: 'high' | 'medium' | 'low';
    tags?: string[];
    dateFrom?: number;
    dateTo?: number;
    limit?: number;
}
export declare class CEXAnnouncementsService {
    private static readonly REQUEST_TIMEOUT;
    private static readonly CACHE_TTL;
    private static cache;
    /**
     * 从数据库获取公告
     */
    static getAnnouncementsFromDB(filter?: {
        exchange?: string;
        category?: string;
        importance?: 'high' | 'medium' | 'low';
        limit?: number;
        offset?: number;
    }): Promise<ExchangeAnnouncement[]>;
    /**
     * 保存公告到数据库
     */
    static saveAnnouncementsToDB(announcements: ExchangeAnnouncement[]): Promise<void>;
    /**
     * 生成内容哈希值用于去重
     */
    private static generateContentHash;
    /**
     * 获取Binance公告
     */
    static getBinanceAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取OKX公告
     */
    static getOKXAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取Coinbase Pro公告
     */
    static getCoinbaseAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取Kraken公告
     */
    static getKrakenAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取Bybit公告
     */
    static getBybitAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取Huobi公告
     */
    static getHuobiAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取KuCoin公告
     */
    static getKuCoinAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取Bitget公告
     */
    static getBitgetAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取Gate.io公告
     */
    static getGateAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取所有交易所公告（优先从数据库获取）
     */
    static getAllAnnouncements(filter?: AnnouncementFilter): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取后备公告数据（在API失败时使用）
     */
    private static getFallbackAnnouncements;
    /**
     * 应用过滤器
     */
    private static applyFilter;
    /**
     * 确定公告重要性
     */
    private static determineImportance;
    /**
     * 分类公告
     */
    private static categorizeAnnouncement;
    /**
     * 提取标签
     */
    private static extractTags;
    /**
     * 获取特定币种相关公告
     */
    static getTokenRelatedAnnouncements(tokenSymbol: string): Promise<ExchangeAnnouncement[]>;
    /**
     * 获取高优先级公告
     */
    static getHighPriorityAnnouncements(): Promise<ExchangeAnnouncement[]>;
    /**
     * 清除缓存
     */
    static clearCache(): void;
    /**
     * 增强公告内容 - 将英文标题转换为更友好的中文描述
     */
    private static enhanceAnnouncementContent;
    /**
     * 从标题中提取代币名称
     */
    private static extractTokenName;
    /**
     * 根据标题生成内容描述
     */
    private static generateContentFromTitle;
    /**
     * Binance模拟数据
     */
    private static getMockBinanceAnnouncements;
    /**
     * OKX模拟数据 - 基于真实最新动态的中文版本
     */
    private static getMockOKXAnnouncements;
    /**
     * KuCoin模拟数据
     */
    private static getMockKuCoinAnnouncements;
    /**
     * Bybit模拟数据
     */
    private static getMockBybitAnnouncements;
    /**
     * 使用新的爬虫服务获取真实数据
     */
    static getAnnouncementsWithScraper(): Promise<ExchangeAnnouncement[]>;
    /**
     * 替换现有的Binance API调用为新爬虫服务
     */
    static getBinanceAnnouncementsV2(): Promise<ExchangeAnnouncement[]>;
    /**
     * 替换现有的OKX API调用为新爬虫服务
     */
    static getOKXAnnouncementsV2(): Promise<ExchangeAnnouncement[]>;
}
//# sourceMappingURL=cex-announcements.service.d.ts.map