import { ScrapedAnnouncement } from './cex-scraper.service';
export declare class WebScraperService {
    private static readonly REQUEST_TIMEOUT;
    private static readonly MAX_RETRIES;
    /**
     * 获取标准请求头
     */
    private static getHeaders;
    /**
     * 发送HTTP请求 - 增强版
     */
    private static makeRequest;
    /**
     * 根据URL获取合适的Referer
     */
    private static getRefererForUrl;
    /**
     * 从URL提取交易所名称
     */
    private static getExchangeFromUrl;
    /**
     * 延迟函数
     */
    private static delay;
    /**
     * 爬取Binance公告 - 通过网页解析 (增强版)
     */
    static scrapeBinanceWeb(): Promise<ScrapedAnnouncement[]>;
    /**
     * 爬取OKX公告 - 通过网页解析 (增强版)
     */
    static scrapeOkxWeb(): Promise<ScrapedAnnouncement[]>;
    /**
     * 解析Binance HTML页面 (增强版)
     */
    private static parseBinanceHtml;
    /**
     * 从__APP_DATA__提取Binance数据
     */
    private static extractBinanceAppData;
    /**
     * 从__NEXT_DATA__提取Binance数据
     */
    private static extractBinanceNextData;
    /**
     * 使用正则表达式提取JSON数据
     */
    private static extractBinanceRegexData;
    /**
     * 从HTML内容提取
     */
    private static extractBinanceHtmlContent;
    /**
     * 解析OKX HTML页面 (增强版)
     */
    private static parseOkxHtml;
    /**
     * 从__NEXT_DATA__提取OKX数据
     */
    private static extractOkxNextData;
    /**
     * 从其他脚本提取OKX数据
     */
    private static extractOkxScriptData;
    /**
     * 从HTML内容提取OKX数据
     */
    private static extractOkxHtmlContent;
    /**
     * 通用JSON数据解析方法
     */
    private static parseJsonDataForAnnouncements;
    /**
     * 从数据对象创建公告
     */
    private static createAnnouncementFromData;
    /**
     * 映射分类
     */
    private static mapCategory;
    /**
     * 判断重要性
     */
    private static determineImportance;
    /**
     * 提取标签
     */
    private static extractTags;
    /**
     * 解析时间
     */
    private static parseTime;
    /**
     * Binance示例数据
     */
    private static getBinanceExampleData;
    /**
     * OKX示例数据
     */
    private static getOkxExampleData;
    /**
     * 综合网页爬取
     */
    static scrapeAllWeb(): Promise<ScrapedAnnouncement[]>;
}
//# sourceMappingURL=web-scraper.service.d.ts.map