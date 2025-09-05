import { ScrapedAnnouncement } from './cex-scraper.service';
export interface ApiEndpoint {
    name: string;
    url: string;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    parser: (data: any) => ScrapedAnnouncement[];
    priority: number;
}
export declare class CexApiSourcesService {
    /**
     * Binance API数据源配置
     */
    private static readonly BINANCE_SOURCES;
    /**
     * OKX API数据源配置
     */
    private static readonly OKX_SOURCES;
    /**
     * 其他交易所数据源
     */
    private static readonly OTHER_SOURCES;
    /**
     * 获取Binance公告数据
     */
    static fetchBinanceAnnouncements(): Promise<ScrapedAnnouncement[]>;
    /**
     * 获取OKX公告数据
     */
    static fetchOkxAnnouncements(): Promise<ScrapedAnnouncement[]>;
    /**
     * 获取其他交易所公告数据
     */
    static fetchOtherExchangeAnnouncements(): Promise<ScrapedAnnouncement[]>;
    /**
     * 解析Binance CMS API响应
     */
    private static parseBinanceCmsResponse;
    /**
     * 解析Binance Support API响应
     */
    private static parseBinanceSupportResponse;
    /**
     * 解析Binance News API响应
     */
    private static parseBinanceNewsResponse;
    /**
     * 解析Binance RSS响应
     */
    private static parseBinanceRssResponse;
    /**
     * 解析OKX Support API响应
     */
    private static parseOkxSupportResponse;
    /**
     * 解析OKX Help API响应
     */
    private static parseOkxHelpResponse;
    /**
     * 解析OKX News API响应
     */
    private static parseOkxNewsResponse;
    /**
     * 解析Bybit响应
     */
    private static parseBybitResponse;
    /**
     * 解析HTX响应
     */
    private static parseHtxResponse;
    /**
     * 通用分类映射
     */
    private static mapGeneralCategory;
    /**
     * Binance分类映射
     */
    private static mapBinanceCategory;
    /**
     * OKX分类映射
     */
    private static mapOkxCategory;
    /**
     * 判断Binance重要性
     */
    private static determineBinanceImportance;
    /**
     * 判断OKX重要性
     */
    private static determineOkxImportance;
    /**
     * 判断通用重要性
     */
    private static determineGeneralImportance;
    /**
     * 提取代币标签
     */
    private static extractTokenTags;
}
//# sourceMappingURL=cex-api-sources.service.d.ts.map