import axios from 'axios';
import { Logger } from '@/utils/logger';

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

export class MarketDataService {
  private static readonly BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
  private static readonly OKX_BASE_URL = 'https://www.okx.com/api/v5';
  private static readonly GATE_BASE_URL = 'https://api.gateio.ws/api/v4';

  // 请求限流配置
  private static readonly REQUEST_TIMEOUT = 5000;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  /**
   * 获取Binance市场数据
   */
  static async getBinanceData(symbols?: string[]): Promise<MarketTicker[]> {
    try {
      const endpoint = '/ticker/24hr';
      const symbolParam = symbols ? `?symbols=${JSON.stringify(symbols)}` : '';
      
      const response = await axios.get(`${this.BINANCE_BASE_URL}${endpoint}${symbolParam}`, {
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
        }
      });

      const data = Array.isArray(response.data) ? response.data : [response.data];
      
      return data.map((ticker: any): MarketTicker => {
        const symbol = ticker.symbol;
        let baseAsset = symbol;
        let quoteAsset = 'USDT';
        
        // 正确解析交易对
        if (symbol.endsWith('USDT')) {
          baseAsset = symbol.replace('USDT', '');
          quoteAsset = 'USDT';
        } else if (symbol.endsWith('BUSD')) {
          baseAsset = symbol.replace('BUSD', '');
          quoteAsset = 'BUSD';
        } else if (symbol.endsWith('BTC')) {
          baseAsset = symbol.replace('BTC', '');
          quoteAsset = 'BTC';
        } else if (symbol.endsWith('ETH')) {
          baseAsset = symbol.replace('ETH', '');
          quoteAsset = 'ETH';
        }

        return {
          symbol,
          baseAsset,
          quoteAsset,
          price: parseFloat(ticker.lastPrice),
          priceChange: parseFloat(ticker.priceChange),
          priceChangePercent: parseFloat(ticker.priceChangePercent),
          volume: parseFloat(ticker.volume),
          quoteVolume: parseFloat(ticker.quoteVolume),
          high: parseFloat(ticker.highPrice),
          low: parseFloat(ticker.lowPrice),
          openPrice: parseFloat(ticker.openPrice),
          closePrice: parseFloat(ticker.lastPrice),
          exchange: 'binance',
          timestamp: Date.now()
        };
      });
    } catch (error) {
      Logger.error('Failed to fetch Binance data', { error });
      throw new Error('Binance API request failed');
    }
  }

  /**
   * 获取OKX市场数据
   */
  static async getOKXData(symbols?: string[]): Promise<MarketTicker[]> {
    try {
      const endpoint = '/market/tickers';
      const instType = 'SPOT';
      
      const response = await axios.get(`${this.OKX_BASE_URL}${endpoint}`, {
        params: { instType },
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
        }
      });

      if (response.data.code !== '0') {
        throw new Error(`OKX API error: ${response.data.msg}`);
      }

      const data = response.data.data || [];
      let filteredData = data;

      if (symbols && symbols.length > 0) {
        const okxSymbols = symbols.map(s => s.replace('USDT', '-USDT').replace('BTC', '-BTC'));
        filteredData = data.filter((ticker: any) => okxSymbols.includes(ticker.instId));
      }

      return filteredData.map((ticker: any): MarketTicker => {
        const [baseAsset, quoteAsset] = ticker.instId.split('-');
        return {
          symbol: ticker.instId.replace('-', ''),
          baseAsset,
          quoteAsset,
          price: parseFloat(ticker.last),
          priceChange: parseFloat(ticker.last) - parseFloat(ticker.open24h),
          priceChangePercent: parseFloat(ticker.chgPct) * 100,
          volume: parseFloat(ticker.vol24h),
          quoteVolume: parseFloat(ticker.volCcy24h),
          high: parseFloat(ticker.high24h),
          low: parseFloat(ticker.low24h),
          openPrice: parseFloat(ticker.open24h),
          closePrice: parseFloat(ticker.last),
          exchange: 'okx',
          timestamp: parseInt(ticker.ts)
        };
      });
    } catch (error) {
      Logger.error('Failed to fetch OKX data', { error });
      throw new Error('OKX API request failed');
    }
  }

  /**
   * 获取Gate.io市场数据
   */
  static async getGateData(symbols?: string[]): Promise<MarketTicker[]> {
    try {
      const endpoint = '/spot/tickers';
      
      const response = await axios.get(`${this.GATE_BASE_URL}${endpoint}`, {
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
        }
      });

      const data = response.data || [];
      let filteredData = data;

      if (symbols && symbols.length > 0) {
        const gateSymbols = symbols.map(s => s.replace('USDT', '_USDT').replace('BTC', '_BTC'));
        filteredData = data.filter((ticker: any) => gateSymbols.includes(ticker.currency_pair));
      }

      return filteredData.map((ticker: any): MarketTicker => {
        const [baseAsset, quoteAsset] = ticker.currency_pair.split('_');
        return {
          symbol: ticker.currency_pair.replace('_', ''),
          baseAsset,
          quoteAsset,
          price: parseFloat(ticker.last),
          priceChange: parseFloat(ticker.change),
          priceChangePercent: parseFloat(ticker.change_percentage),
          volume: parseFloat(ticker.base_volume),
          quoteVolume: parseFloat(ticker.quote_volume),
          high: parseFloat(ticker.high),
          low: parseFloat(ticker.low),
          openPrice: parseFloat(ticker.last) - parseFloat(ticker.change),
          closePrice: parseFloat(ticker.last),
          exchange: 'gate',
          timestamp: Date.now()
        };
      });
    } catch (error) {
      Logger.error('Failed to fetch Gate.io data', { error });
      throw new Error('Gate.io API request failed');
    }
  }

  /**
   * 主流币种列表
   */
  private static readonly POPULAR_SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'MATICUSDT', 
    'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'ATOMUSDT', 'NEARUSDT', 'FTMUSDT',
    'SANDUSDT', 'MANAUSDT', 'GRTUSDT', 'SUSHIUSDT', 'COMPUSDT', 'AAVEUSDT',
    'MKRUSDT', 'YFIUSDT', '1INCHUSDT', 'CRVUSDT', 'SNXUSDT', 'RENUSDT',
    'DOGEUSDT', 'SHIBUSDT', 'XRPUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT'
  ];

  /**
   * 过滤主流交易对
   */
  private static filterPopularPairs(data: MarketTicker[]): MarketTicker[] {
    return data.filter(ticker => {
      // 只保留USDT交易对
      if (!ticker.symbol.endsWith('USDT')) return false;
      
      // 过滤掉法币对 (IDR, BIDR, TRY, NGN, ARS等)
      if (/[A-Z]{3,4}USDT$/.test(ticker.symbol) && 
          ticker.symbol.match(/(IDR|BIDR|TRY|NGN|ARS|COP|RUB|JPY)USDT$/)) {
        return false;
      }
      
      // 优先显示热门币种
      if (this.POPULAR_SYMBOLS.includes(ticker.symbol)) return true;
      
      // 其他条件：价格合理且有成交量
      return ticker.price > 0 && ticker.price < 100000 && ticker.quoteVolume > 1000000;
    });
  }

  /**
   * 获取聚合市场数据
   */
  static async getAggregatedMarketData(symbols?: string[]): Promise<MarketTicker[]> {
    // 如果指定了symbols，直接获取这些交易对
    if (symbols && symbols.length > 0) {
      const promises = [
        this.getBinanceData(symbols).catch(() => []),
        this.getOKXData(symbols).catch(() => []),
        this.getGateData(symbols).catch(() => [])
      ];

      const results = await Promise.allSettled(promises);
      
      const allData: MarketTicker[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allData.push(...result.value);
        } else {
          const exchanges = ['Binance', 'OKX', 'Gate.io'];
          Logger.warn(`Failed to fetch data from ${exchanges[index]}:`, result.reason);
        }
      });

      return allData.sort((a, b) => b.quoteVolume - a.quoteVolume);
    }

    // 否则获取热门交易对
    const promises = [
      this.getBinanceData(this.POPULAR_SYMBOLS).catch(() => []),
      this.getOKXData(this.POPULAR_SYMBOLS).catch(() => []),
      this.getGateData(this.POPULAR_SYMBOLS).catch(() => [])
    ];

    const results = await Promise.allSettled(promises);
    
    const allData: MarketTicker[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const filteredData = this.filterPopularPairs(result.value);
        allData.push(...filteredData);
      } else {
        const exchanges = ['Binance', 'OKX', 'Gate.io'];
        Logger.warn(`Failed to fetch data from ${exchanges[index]}:`, result.reason);
      }
    });

    // 按交易量排序，限制返回数量
    return allData
      .sort((a, b) => b.quoteVolume - a.quoteVolume)
      .slice(0, 100); // 只返回前100个
  }

  /**
   * 获取特定交易对的价格对比
   */
  static async getPriceComparison(symbol: string): Promise<{
    symbol: string;
    prices: Array<{
      exchange: string;
      price: number;
      volume: number;
      timestamp: number;
    }>;
    bestBid: { exchange: string; price: number };
    bestAsk: { exchange: string; price: number };
    maxSpread: { percentage: number; absolute: number };
  }> {
    const allData = await this.getAggregatedMarketData([symbol]);
    const symbolData = allData.filter(ticker => ticker.symbol === symbol);

    if (symbolData.length === 0) {
      throw new Error(`No data found for symbol ${symbol}`);
    }

    const prices = symbolData.map(ticker => ({
      exchange: ticker.exchange,
      price: ticker.price,
      volume: ticker.quoteVolume,
      timestamp: ticker.timestamp
    }));

    // 找出最佳买卖价
    const sortedByPrice = symbolData.sort((a, b) => b.price - a.price);
    const bestBid = { exchange: sortedByPrice[0].exchange, price: sortedByPrice[0].price };
    const bestAsk = { exchange: sortedByPrice[sortedByPrice.length - 1].exchange, price: sortedByPrice[sortedByPrice.length - 1].price };

    // 计算最大价差
    const maxPrice = Math.max(...prices.map(p => p.price));
    const minPrice = Math.min(...prices.map(p => p.price));
    const maxSpread = {
      absolute: maxPrice - minPrice,
      percentage: ((maxPrice - minPrice) / minPrice) * 100
    };

    return {
      symbol,
      prices,
      bestBid,
      bestAsk,
      maxSpread
    };
  }

  /**
   * 获取Binance订单簿
   */
  static async getBinanceOrderBook(symbol: string, limit = 20): Promise<OrderBook> {
    try {
      const response = await axios.get(`${this.BINANCE_BASE_URL}/depth`, {
        params: { symbol, limit },
        timeout: this.REQUEST_TIMEOUT
      });

      return {
        symbol,
        exchange: 'binance',
        bids: response.data.bids.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity)
        })),
        asks: response.data.asks.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity)
        })),
        timestamp: Date.now()
      };
    } catch (error) {
      Logger.error('Failed to fetch Binance order book', { error, symbol });
      throw error;
    }
  }

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
  }> {
    const anomalies: Array<any> = [];

    currentData.forEach(current => {
      const historical = historicalData.find(h => h.symbol === current.symbol && h.exchange === current.exchange);
      if (!historical) return;

      const priceChangeThreshold = 10; // 10%价格变化
      const volumeThreshold = 5; // 5倍成交量

      const isPriceSpike = Math.abs(current.priceChangePercent) > priceChangeThreshold;
      const isVolumeSpike = current.quoteVolume > historical.quoteVolume * volumeThreshold;

      if (isPriceSpike || isVolumeSpike) {
        let anomalyType: 'price_spike' | 'volume_spike' | 'both';
        if (isPriceSpike && isVolumeSpike) anomalyType = 'both';
        else if (isPriceSpike) anomalyType = 'price_spike';
        else anomalyType = 'volume_spike';

        let severity: 'low' | 'medium' | 'high';
        if (Math.abs(current.priceChangePercent) > 50 || current.quoteVolume > historical.quoteVolume * 10) {
          severity = 'high';
        } else if (Math.abs(current.priceChangePercent) > 25 || current.quoteVolume > historical.quoteVolume * 7) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        anomalies.push({
          symbol: current.symbol,
          currentPrice: current.price,
          priceChange: current.priceChangePercent,
          volumeSpike: isVolumeSpike,
          anomalyType,
          severity
        });
      }
    });

    return anomalies;
  }
}