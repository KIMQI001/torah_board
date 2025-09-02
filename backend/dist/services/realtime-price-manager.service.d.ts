import { EventEmitter } from 'events';
export interface AggregatedPriceUpdate {
    symbol: string;
    exchanges: {
        [key: string]: {
            price: number;
            priceChange: number;
            priceChangePercent: number;
            volume: number;
            timestamp: number;
        };
    };
    bestPrice: {
        buy: {
            exchange: string;
            price: number;
        };
        sell: {
            exchange: string;
            price: number;
        };
    };
    averagePrice: number;
    priceSpread: number;
    lastUpdate: number;
}
export declare class RealTimePriceManager extends EventEmitter {
    private priceCache;
    private subscribedSymbols;
    private updateInterval;
    private wsConnected;
    private fallbackToPolling;
    private pollingInterval;
    constructor();
    private setupWebSocketListeners;
    private checkConnectionStatus;
    private handlePriceUpdate;
    private calculateAggregatedPrices;
    private checkPriceAlerts;
    startRealTimePriceTracking(symbols: string[]): void;
    addSymbols(symbols: string[]): void;
    removeSymbols(symbols: string[]): void;
    private startPollingFallback;
    private stopPollingFallback;
    stopRealTimePriceTracking(): void;
    getAggregatedPrice(symbol: string): AggregatedPriceUpdate | null;
    getAllAggregatedPrices(): AggregatedPriceUpdate[];
    getStatus(): {
        subscribedSymbols: string[];
        wsConnected: boolean;
        fallbackToPolling: boolean;
        wsConnectionStatus: Record<string, string>;
        cachedSymbols: string[];
    };
    reconnectWebSocket(): void;
    setPollingInterval(interval: number): void;
}
export declare const realTimePriceManager: RealTimePriceManager;
//# sourceMappingURL=realtime-price-manager.service.d.ts.map