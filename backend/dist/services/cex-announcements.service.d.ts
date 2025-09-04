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
     * 获取所有交易所公告
     */
    static getAllAnnouncements(filter?: AnnouncementFilter): Promise<ExchangeAnnouncement[]>;
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
     * Binance模拟数据
     */
    private static getMockBinanceAnnouncements;
}
//# sourceMappingURL=cex-announcements.service.d.ts.map