export interface ExchangeSymbolInfo {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    exchange: string;
    status: string;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
    baseAssetPrecision: number;
    quotePrecision: number;
    orderTypes: string[];
    timeInForce: string[];
    filters: any;
    permissions: string[];
    defaultSelfTradePreventionMode?: string;
    allowedSelfTradePreventionModes?: string[];
}
export declare class ExchangeSymbolsService {
    private static readonly BINANCE_BASE_URL;
    private static readonly OKX_BASE_URL;
    private static readonly GATE_BASE_URL;
    private static readonly REQUEST_TIMEOUT;
    private static readonly MAX_RETRIES;
    private static readonly RETRY_DELAY;
    /**
     * 获取Binance交易所币种信息
     */
    static fetchBinanceSymbols(): Promise<ExchangeSymbolInfo[]>;
    /**
     * 获取OKX交易所币种信息
     */
    static fetchOKXSymbols(): Promise<ExchangeSymbolInfo[]>;
    /**
     * 获取Gate.io交易所币种信息
     */
    static fetchGateSymbols(): Promise<ExchangeSymbolInfo[]>;
    /**
     * 获取所有交易所的币种信息
     */
    static fetchAllExchangeSymbols(): Promise<ExchangeSymbolInfo[]>;
    /**
     * 保存币种信息到数据库
     */
    static saveSymbolsToDatabase(symbols: ExchangeSymbolInfo[]): Promise<void>;
    /**
     * 从数据库搜索币种信息
     */
    static searchSymbols(query: string, limit?: number, exchanges?: string[]): Promise<any[]>;
    /**
     * 获取所有可用的币种列表（用于收藏功能）
     */
    static getAllAvailableSymbols(limit?: number, exchanges?: string[]): Promise<any[]>;
    /**
     * 定期更新币种信息任务
     */
    static updateSymbolsTask(): Promise<void>;
}
//# sourceMappingURL=exchange-symbols.service.d.ts.map