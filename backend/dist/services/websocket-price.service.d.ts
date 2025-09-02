import EventEmitter from 'events';
export interface RealTimePriceUpdate {
    symbol: string;
    exchange: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    volume: number;
    timestamp: number;
}
export declare class WebSocketPriceService extends EventEmitter {
    private connections;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectInterval;
    private isConnecting;
    constructor();
    connectBinanceStream(symbols: string[]): void;
    connectOKXStream(symbols: string[]): void;
    connectGateStream(symbols: string[]): void;
    private connectWebSocket;
    private scheduleReconnect;
    connectAllStreams(symbols: string[]): void;
    disconnectAll(): void;
    getConnectionStatus(): Record<string, string>;
    reconnectExchange(exchange: string, symbols: string[]): void;
}
export declare const webSocketPriceService: WebSocketPriceService;
//# sourceMappingURL=websocket-price.service.d.ts.map