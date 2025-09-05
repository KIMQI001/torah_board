export interface ScrapedAnnouncement {
    id: string;
    exchange: string;
    title: string;
    content: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
    publishTime: number;
    tags: string[];
    url: string;
}
export declare class CexScraperService {
    private static readonly REQUEST_TIMEOUT;
    private static readonly MAX_RETRIES;
    private static readonly RETRY_DELAY;
    private static readonly BINANCE_ENDPOINTS;
    private static readonly OKX_ENDPOINTS;
    /**
     * 获取通用请求头
     */
    private static getCommonHeaders;
    /**
     * 发送HTTP请求并处理重试
     */
    private static makeRequest;
    /**
     * 延迟函数
     */
    private static delay;
    /**
     * 获取Binance公告数据 - 增强版
     */
    static scrapeBinanceAnnouncements(): Promise<ScrapedAnnouncement[]>;
    /**
     * 尝试Binance传统API（使用反爬虫绕过）
     */
    private static tryBinanceTraditionalApis;
    /**
     * 获取OKX公告数据 - 增强版
     */
    static scrapeOkxAnnouncements(): Promise<ScrapedAnnouncement[]>;
    /**
     * 尝试OKX传统API（使用反爬虫绕过）
     */
    private static tryOkxTraditionalApis;
    /**
     * 验证Binance API响应
     */
    private static isBinanceValidResponse;
    /**
     * 验证OKX API响应
     */
    private static isOkxValidResponse;
    /**
     * 解析Binance API响应
     */
    private static parseBinanceResponse;
    /**
     * 解析OKX API响应
     */
    private static parseOkxResponse;
    /**
     * 映射Binance分类
     */
    private static mapBinanceCategory;
    /**
     * 映射OKX分类
     */
    private static mapOkxCategory;
    /**
     * 判断Binance公告重要性
     */
    private static determineBinanceImportance;
    /**
     * 判断OKX公告重要性
     */
    private static determineOkxImportance;
    /**
     * 提取Binance标签
     */
    private static extractBinanceTags;
    /**
     * 提取OKX标签
     */
    private static extractOkxTags;
    /**
     * 备用方案：网页抓取Binance
     */
    private static scrapeBinanceWebPage;
    /**
     * 备用方案：网页抓取OKX
     */
    private static scrapeOkxWebPage;
    /**
     * Binance备用数据
     */
    private static getBinanceFallbackData;
    /**
     * OKX备用数据
     */
    private static getOkxFallbackData;
    /**
     * 综合抓取方法 - 增强版
     */
    static scrapeAllExchanges(): Promise<ScrapedAnnouncement[]>;
    /**
     * 去除重复公告
     */
    private static removeDuplicateAnnouncements;
    /**
     * 健康检查 - 检测各个数据源的可用性
     */
    static healthCheck(): Promise<{
        [key: string]: boolean;
    }>;
}
//# sourceMappingURL=cex-scraper.service.d.ts.map