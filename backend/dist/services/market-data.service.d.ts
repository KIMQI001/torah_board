export interface MarketTicker {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    volume: number;
    quoteVolume: number;
    high: number;
    low: number;
    openPrice: number;
    closePrice: number;
    exchange: string;
    timestamp: number;
}
export interface OrderBookEntry {
    price: number;
    quantity: number;
}
export interface OrderBook {
    symbol: string;
    exchange: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    timestamp: number;
}
export interface ExchangeAnnouncement {
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
export declare class MarketDataService {
    private static readonly BINANCE_BASE_URL;
    private static readonly OKX_BASE_URL;
    private static readonly GATE_BASE_URL;
    private static readonly REQUEST_TIMEOUT;
    private static readonly MAX_RETRIES;
    private static readonly RETRY_DELAY;
    /**
     * 获取Binance市场数据
     */
    static getBinanceData(symbols?: string[]): Promise<MarketTicker[]>;
    /**
     * 获取OKX市场数据
     */
    static getOKXData(symbols?: string[]): Promise<MarketTicker[]>;
    /**
     * 获取Gate.io市场数据
     */
    static getGateData(symbols?: string[]): Promise<MarketTicker[]>;
    /**
     * 主流币种列表
     */
    private static readonly POPULAR_SYMBOLS;
    /**
     * 过滤主流交易对
     */
    private static filterPopularPairs;
    /**
     * 获取聚合市场数据
     */
    static getAggregatedMarketData(symbols?: string[]): Promise<MarketTicker[]>;
    /**
     * 获取特定交易对的价格对比
     */
    static getPriceComparison(symbol: string): Promise<{
        symbol: string;
        prices: Array<{
            exchange: string;
            price: number;
            volume: number;
            timestamp: number;
        }>;
        bestBid: {
            exchange: string;
            price: number;
        };
        bestAsk: {
            exchange: string;
            price: number;
        };
        maxSpread: {
            percentage: number;
            absolute: number;
        };
    }>;
    /**
     * 获取Binance订单簿
     */
    static getBinanceOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
    /**
     * 检测价格异常波动
     */
    static detectPriceAnomalies(currentData: MarketTicker[], historicalData: MarketTicker[]): Array<{
        symbol: string;
        currentPrice: number;
        priceChange: number;
        volumeSpike: boolean;
        anomalyType: 'price_spike' | 'volume_spike' | 'both';
        severity: 'low' | 'medium' | 'high';
    }>;
}
//# sourceMappingURL=market-data.service.d.ts.map