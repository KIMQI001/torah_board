import { EventEmitter } from 'events';
import { webSocketPriceService, RealTimePriceUpdate } from './websocket-price.service';
import { MarketDataService } from './market-data.service';
import { PriceAlertsService } from './price-alerts.service';

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
    buy: { exchange: string; price: number; };
    sell: { exchange: string; price: number; };
  };
  averagePrice: number;
  priceSpread: number;
  lastUpdate: number;
}

export class RealTimePriceManager extends EventEmitter {
  private priceCache: Map<string, AggregatedPriceUpdate> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private wsConnected = false;
  private fallbackToPolling = false;
  private pollingInterval = 10000; // 10秒轮询作为WebSocket的备用方案

  constructor() {
    super();
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // WebSocket价格更新事件
    webSocketPriceService.on('priceUpdate', (update: RealTimePriceUpdate) => {
      this.handlePriceUpdate(update);
    });

    // WebSocket连接状态事件
    webSocketPriceService.on('connected', (exchange: string) => {
      console.log(`✓ ${exchange} WebSocket已连接`);
      this.wsConnected = true;
      this.fallbackToPolling = false;
    });

    webSocketPriceService.on('disconnected', (exchange: string) => {
      console.log(`✗ ${exchange} WebSocket已断开`);
      this.checkConnectionStatus();
    });

    webSocketPriceService.on('error', ({ exchange, error }) => {
      console.error(`WebSocket错误 - ${exchange}:`, error);
      this.checkConnectionStatus();
    });
  }

  private checkConnectionStatus() {
    const status = webSocketPriceService.getConnectionStatus();
    const connectedCount = Object.values(status).filter(s => s === 'connected').length;
    
    // 如果没有任何WebSocket连接，启用轮询备用方案
    if (connectedCount === 0 && !this.fallbackToPolling) {
      console.log('WebSocket连接全部断开，启用轮询备用方案');
      this.fallbackToPolling = true;
      this.startPollingFallback();
    } else if (connectedCount > 0 && this.fallbackToPolling) {
      console.log('WebSocket连接恢复，停用轮询备用方案');
      this.fallbackToPolling = false;
      this.stopPollingFallback();
    }
  }

  private handlePriceUpdate(update: RealTimePriceUpdate) {
    const { symbol, exchange } = update;
    const key = symbol.toUpperCase();

    // 更新价格缓存
    let aggregated = this.priceCache.get(key);
    if (!aggregated) {
      aggregated = {
        symbol: key,
        exchanges: {},
        bestPrice: { buy: { exchange: '', price: 0 }, sell: { exchange: '', price: 0 } },
        averagePrice: 0,
        priceSpread: 0,
        lastUpdate: Date.now()
      };
    }

    // 更新特定交易所的数据
    aggregated.exchanges[exchange] = {
      price: update.price,
      priceChange: update.priceChange,
      priceChangePercent: update.priceChangePercent,
      volume: update.volume,
      timestamp: update.timestamp
    };

    // 计算最佳价格和平均价格
    this.calculateAggregatedPrices(aggregated);
    
    // 更新时间戳
    aggregated.lastUpdate = Date.now();
    
    // 保存到缓存
    this.priceCache.set(key, aggregated);

    // 发出价格更新事件
    this.emit('aggregatedPriceUpdate', aggregated);

    // 检查价格预警
    this.checkPriceAlerts(aggregated);
  }

  private calculateAggregatedPrices(aggregated: AggregatedPriceUpdate) {
    const exchanges = Object.entries(aggregated.exchanges);
    if (exchanges.length === 0) return;

    const prices = exchanges.map(([_, data]) => data.price).filter(p => p > 0);
    if (prices.length === 0) return;

    // 计算平均价格
    aggregated.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // 找到最高和最低价格作为买卖最佳价格
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    const maxExchange = exchanges.find(([_, data]) => data.price === maxPrice)?.[0] || '';
    const minExchange = exchanges.find(([_, data]) => data.price === minPrice)?.[0] || '';

    aggregated.bestPrice = {
      buy: { exchange: minExchange, price: minPrice }, // 买入选择最低价
      sell: { exchange: maxExchange, price: maxPrice }  // 卖出选择最高价
    };

    // 计算价差
    aggregated.priceSpread = maxPrice - minPrice;
  }

  private async checkPriceAlerts(aggregated: AggregatedPriceUpdate) {
    try {
      // 使用平均价格检查预警
      await PriceAlertsService.checkAndTriggerAlerts(aggregated.symbol, aggregated.averagePrice);
    } catch (error) {
      console.error('检查价格预警时出错:', error);
    }
  }

  // 启动实时价格监控
  startRealTimePriceTracking(symbols: string[]) {
    console.log('启动实时价格监控:', symbols);
    
    // 更新订阅的交易对
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol.toUpperCase()));
    
    // 首先尝试连接WebSocket
    webSocketPriceService.connectAllStreams(symbols);
    
    // 设置连接检查延时
    setTimeout(() => {
      this.checkConnectionStatus();
    }, 5000);
  }

  // 添加新的交易对监控
  addSymbols(symbols: string[]) {
    const newSymbols = symbols.filter(s => !this.subscribedSymbols.has(s.toUpperCase()));
    
    if (newSymbols.length > 0) {
      console.log('添加新的交易对监控:', newSymbols);
      newSymbols.forEach(symbol => this.subscribedSymbols.add(symbol.toUpperCase()));
      
      // 重新连接WebSocket以包含新交易对
      webSocketPriceService.disconnectAll();
      setTimeout(() => {
        webSocketPriceService.connectAllStreams(Array.from(this.subscribedSymbols));
      }, 1000);
    }
  }

  // 移除交易对监控
  removeSymbols(symbols: string[]) {
    symbols.forEach(symbol => {
      const key = symbol.toUpperCase();
      this.subscribedSymbols.delete(key);
      this.priceCache.delete(key);
    });
    
    // 重新连接WebSocket
    if (this.subscribedSymbols.size > 0) {
      webSocketPriceService.disconnectAll();
      setTimeout(() => {
        webSocketPriceService.connectAllStreams(Array.from(this.subscribedSymbols));
      }, 1000);
    } else {
      this.stopRealTimePriceTracking();
    }
  }

  // 启动轮询备用方案
  private startPollingFallback() {
    if (this.updateInterval) return;

    console.log('启动价格轮询备用方案，间隔:', this.pollingInterval);
    
    this.updateInterval = setInterval(async () => {
      try {
        const symbols = Array.from(this.subscribedSymbols);
        if (symbols.length === 0) return;

        // 使用MarketDataService获取价格数据
        const marketData = await MarketDataService.getAggregatedMarketData({ symbols });
        
        // 转换为实时更新格式并处理
        marketData.forEach(ticker => {
          const update: RealTimePriceUpdate = {
            symbol: ticker.symbol,
            exchange: ticker.exchange,
            price: ticker.price,
            priceChange: ticker.priceChange,
            priceChangePercent: ticker.priceChangePercent,
            volume: ticker.volume,
            timestamp: ticker.timestamp
          };
          
          this.handlePriceUpdate(update);
        });
      } catch (error) {
        console.error('轮询价格数据时出错:', error);
      }
    }, this.pollingInterval);
  }

  // 停止轮询备用方案
  private stopPollingFallback() {
    if (this.updateInterval) {
      console.log('停止价格轮询备用方案');
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 停止实时价格监控
  stopRealTimePriceTracking() {
    console.log('停止实时价格监控');
    
    webSocketPriceService.disconnectAll();
    this.stopPollingFallback();
    
    this.subscribedSymbols.clear();
    this.priceCache.clear();
    this.wsConnected = false;
    this.fallbackToPolling = false;
  }

  // 获取特定交易对的聚合价格数据
  getAggregatedPrice(symbol: string): AggregatedPriceUpdate | null {
    return this.priceCache.get(symbol.toUpperCase()) || null;
  }

  // 获取所有缓存的价格数据
  getAllAggregatedPrices(): AggregatedPriceUpdate[] {
    return Array.from(this.priceCache.values());
  }

  // 获取连接状态信息
  getStatus() {
    return {
      subscribedSymbols: Array.from(this.subscribedSymbols),
      wsConnected: this.wsConnected,
      fallbackToPolling: this.fallbackToPolling,
      wsConnectionStatus: webSocketPriceService.getConnectionStatus(),
      cachedSymbols: Array.from(this.priceCache.keys())
    };
  }

  // 重新连接WebSocket
  reconnectWebSocket() {
    console.log('手动重新连接WebSocket...');
    webSocketPriceService.disconnectAll();
    
    if (this.subscribedSymbols.size > 0) {
      setTimeout(() => {
        webSocketPriceService.connectAllStreams(Array.from(this.subscribedSymbols));
      }, 1000);
    }
  }

  // 设置轮询间隔
  setPollingInterval(interval: number) {
    this.pollingInterval = Math.max(interval, 5000); // 最小5秒间隔
    
    if (this.fallbackToPolling && this.updateInterval) {
      this.stopPollingFallback();
      this.startPollingFallback();
    }
  }
}

// 导出单例实例
export const realTimePriceManager = new RealTimePriceManager();