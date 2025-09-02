import axios from 'axios';
import { Logger } from '@/utils/logger';
import { prisma } from './database';

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

export class ExchangeSymbolsService {
  private static readonly BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
  private static readonly OKX_BASE_URL = 'https://www.okx.com/api/v5';
  private static readonly GATE_BASE_URL = 'https://api.gateio.ws/api/v4';
  
  private static readonly REQUEST_TIMEOUT = 10000;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000;

  /**
   * 获取Binance交易所币种信息
   */
  static async fetchBinanceSymbols(): Promise<ExchangeSymbolInfo[]> {
    try {
      Logger.info('开始获取Binance币种信息');
      
      const response = await axios.get(`${this.BINANCE_BASE_URL}/exchangeInfo`, {
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
        }
      });

      const symbols = response.data.symbols || [];
      Logger.info(`获取到 ${symbols.length} 个Binance交易对`);

      return symbols
        .filter((symbol: any) => symbol.status === 'TRADING')
        .map((symbol: any): ExchangeSymbolInfo => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          exchange: 'binance',
          status: symbol.status,
          isSpotTradingAllowed: symbol.isSpotTradingAllowed || true,
          isMarginTradingAllowed: symbol.isMarginTradingAllowed || false,
          baseAssetPrecision: symbol.baseAssetPrecision || 8,
          quotePrecision: symbol.quotePrecision || 8,
          orderTypes: symbol.orderTypes || ['LIMIT', 'MARKET'],
          timeInForce: symbol.timeInForce || ['GTC', 'IOC', 'FOK'],
          filters: symbol.filters || {},
          permissions: symbol.permissions || ['SPOT'],
          defaultSelfTradePreventionMode: symbol.defaultSelfTradePreventionMode,
          allowedSelfTradePreventionModes: symbol.allowedSelfTradePreventionModes
        }));
    } catch (error) {
      Logger.error('获取Binance币种信息失败', { error });
      throw new Error('Failed to fetch Binance symbols');
    }
  }

  /**
   * 获取OKX交易所币种信息
   */
  static async fetchOKXSymbols(): Promise<ExchangeSymbolInfo[]> {
    try {
      Logger.info('开始获取OKX币种信息');
      
      const response = await axios.get(`${this.OKX_BASE_URL}/public/instruments`, {
        params: { instType: 'SPOT' },
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
        }
      });

      if (response.data.code !== '0') {
        throw new Error(`OKX API error: ${response.data.msg}`);
      }

      const symbols = response.data.data || [];
      Logger.info(`获取到 ${symbols.length} 个OKX交易对`);

      return symbols
        .filter((symbol: any) => symbol.state === 'live')
        .map((symbol: any): ExchangeSymbolInfo => {
          const [baseAsset, quoteAsset] = symbol.instId.split('-');
          return {
            symbol: symbol.instId.replace('-', ''),
            baseAsset,
            quoteAsset,
            exchange: 'okx',
            status: symbol.state === 'live' ? 'TRADING' : 'HALT',
            isSpotTradingAllowed: true,
            isMarginTradingAllowed: false,
            baseAssetPrecision: parseInt(symbol.lotSz) || 8,
            quotePrecision: parseInt(symbol.tickSz) || 8,
            orderTypes: ['LIMIT', 'MARKET'],
            timeInForce: ['GTC', 'IOC', 'FOK'],
            filters: {
              minSize: symbol.minSz,
              maxSize: symbol.maxSz,
              tickSize: symbol.tickSz,
              lotSize: symbol.lotSz
            },
            permissions: ['SPOT']
          };
        });
    } catch (error) {
      Logger.error('获取OKX币种信息失败', { error });
      throw new Error('Failed to fetch OKX symbols');
    }
  }

  /**
   * 获取Gate.io交易所币种信息
   */
  static async fetchGateSymbols(): Promise<ExchangeSymbolInfo[]> {
    try {
      Logger.info('开始获取Gate.io币种信息');
      
      const response = await axios.get(`${this.GATE_BASE_URL}/spot/currency_pairs`, {
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
        }
      });

      const symbols = response.data || [];
      Logger.info(`获取到 ${symbols.length} 个Gate.io交易对`);

      return symbols
        .filter((symbol: any) => symbol.trade_status === 'tradable')
        .map((symbol: any): ExchangeSymbolInfo => {
          const [baseAsset, quoteAsset] = symbol.id.split('_');
          return {
            symbol: symbol.id.replace('_', '').toUpperCase(),
            baseAsset: baseAsset.toUpperCase(),
            quoteAsset: quoteAsset.toUpperCase(),
            exchange: 'gate',
            status: symbol.trade_status === 'tradable' ? 'TRADING' : 'HALT',
            isSpotTradingAllowed: true,
            isMarginTradingAllowed: false,
            baseAssetPrecision: parseInt(symbol.base_precision) || 8,
            quotePrecision: parseInt(symbol.quote_precision) || 8,
            orderTypes: ['LIMIT', 'MARKET'],
            timeInForce: ['GTC', 'IOC'],
            filters: {
              minBaseAmount: symbol.min_base_amount,
              minQuoteAmount: symbol.min_quote_amount,
              maxBaseAmount: symbol.max_base_amount,
              maxQuoteAmount: symbol.max_quote_amount
            },
            permissions: ['SPOT']
          };
        });
    } catch (error) {
      Logger.error('获取Gate.io币种信息失败', { error });
      throw new Error('Failed to fetch Gate symbols');
    }
  }

  /**
   * 获取所有交易所的币种信息
   */
  static async fetchAllExchangeSymbols(): Promise<ExchangeSymbolInfo[]> {
    try {
      Logger.info('开始获取所有交易所币种信息');
      
      const results = await Promise.allSettled([
        this.fetchBinanceSymbols(),
        this.fetchOKXSymbols(),
        this.fetchGateSymbols()
      ]);

      const allSymbols: ExchangeSymbolInfo[] = [];
      
      results.forEach((result, index) => {
        const exchanges = ['Binance', 'OKX', 'Gate.io'];
        if (result.status === 'fulfilled') {
          allSymbols.push(...result.value);
          Logger.info(`成功获取${exchanges[index]}币种信息: ${result.value.length}个`);
        } else {
          Logger.error(`获取${exchanges[index]}币种信息失败`, { error: result.reason });
        }
      });

      Logger.info(`总共获取到 ${allSymbols.length} 个交易对`);
      return allSymbols;
    } catch (error) {
      Logger.error('获取交易所币种信息失败', { error });
      throw new Error('Failed to fetch exchange symbols');
    }
  }

  /**
   * 保存币种信息到数据库
   */
  static async saveSymbolsToDatabase(symbols: ExchangeSymbolInfo[]): Promise<void> {
    try {
      Logger.info(`开始保存 ${symbols.length} 个币种信息到数据库`);
      
      const batchSize = 100;
      let processed = 0;
      
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (symbolInfo) => {
          try {
            await prisma.exchangeSymbol.upsert({
              where: {
                symbol_exchange: {
                  symbol: symbolInfo.symbol,
                  exchange: symbolInfo.exchange
                }
              },
              update: {
                status: symbolInfo.status,
                isSpotTradingAllowed: symbolInfo.isSpotTradingAllowed,
                isMarginTradingAllowed: symbolInfo.isMarginTradingAllowed,
                baseAssetPrecision: symbolInfo.baseAssetPrecision,
                quotePrecision: symbolInfo.quotePrecision,
                orderTypes: JSON.stringify(symbolInfo.orderTypes),
                timeInForce: JSON.stringify(symbolInfo.timeInForce),
                filters: JSON.stringify(symbolInfo.filters),
                permissions: JSON.stringify(symbolInfo.permissions),
                defaultSelfTradePreventionMode: symbolInfo.defaultSelfTradePreventionMode,
                allowedSelfTradePreventionModes: symbolInfo.allowedSelfTradePreventionModes ? 
                  JSON.stringify(symbolInfo.allowedSelfTradePreventionModes) : null,
                updatedAt: new Date()
              },
              create: {
                symbol: symbolInfo.symbol,
                baseAsset: symbolInfo.baseAsset,
                quoteAsset: symbolInfo.quoteAsset,
                exchange: symbolInfo.exchange,
                status: symbolInfo.status,
                isSpotTradingAllowed: symbolInfo.isSpotTradingAllowed,
                isMarginTradingAllowed: symbolInfo.isMarginTradingAllowed,
                baseAssetPrecision: symbolInfo.baseAssetPrecision,
                quotePrecision: symbolInfo.quotePrecision,
                orderTypes: JSON.stringify(symbolInfo.orderTypes),
                timeInForce: JSON.stringify(symbolInfo.timeInForce),
                filters: JSON.stringify(symbolInfo.filters),
                permissions: JSON.stringify(symbolInfo.permissions),
                defaultSelfTradePreventionMode: symbolInfo.defaultSelfTradePreventionMode,
                allowedSelfTradePreventionModes: symbolInfo.allowedSelfTradePreventionModes ? 
                  JSON.stringify(symbolInfo.allowedSelfTradePreventionModes) : null
              }
            });
          } catch (error) {
            Logger.error(`保存币种信息失败: ${symbolInfo.symbol}@${symbolInfo.exchange}`, { error });
          }
        }));
        
        processed += batch.length;
        Logger.info(`已处理 ${processed}/${symbols.length} 个币种信息`);
      }
      
      Logger.info(`币种信息保存完成，共处理 ${processed} 个交易对`);
    } catch (error) {
      Logger.error('保存币种信息到数据库失败', { error });
      throw new Error('Failed to save symbols to database');
    }
  }

  /**
   * 获取热门币种（当搜索为空时使用）
   */
  static async getPopularSymbols(limit: number = 50, exchanges?: string[]): Promise<any[]> {
    try {
      const popularBaseAssets = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC', 'ADA', 'XRP', 'DOT', 'DOGE'];
      
      const whereClause: any = {
        AND: [
          { status: 'TRADING' },
          { isSpotTradingAllowed: true },
          { baseAsset: { in: popularBaseAssets } }
        ]
      };

      if (exchanges && exchanges.length > 0) {
        whereClause.AND.push({ exchange: { in: exchanges } });
      }

      const symbols = await prisma.exchangeSymbol.findMany({
        where: whereClause,
        orderBy: [
          { baseAsset: 'asc' },
          { exchange: 'asc' }
        ],
        take: Math.min(limit, 100),
        select: {
          id: true,
          symbol: true,
          baseAsset: true,
          quoteAsset: true,
          exchange: true,
          status: true,
          isSpotTradingAllowed: true,
          baseAssetPrecision: true,
          quotePrecision: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return symbols;
    } catch (error) {
      Logger.error('获取热门币种失败', { error });
      return [];
    }
  }

  /**
   * 从数据库搜索币种信息
   */
  static async searchSymbols(query: string, limit: number = 50, exchanges?: string[]): Promise<any[]> {
    try {
      // 优化：如果查询为空，返回热门币种
      if (!query || query.length < 1) {
        return await this.getPopularSymbols(limit, exchanges);
      }

      const upperQuery = query.toUpperCase();
      const whereClause: any = {
        AND: [
          { status: 'TRADING' },
          { isSpotTradingAllowed: true },
          {
            OR: [
              { baseAsset: { startsWith: upperQuery } },
              { symbol: { startsWith: upperQuery } }
            ]
          }
        ]
      };

      if (exchanges && exchanges.length > 0) {
        whereClause.AND.push({ exchange: { in: exchanges } });
      }

      const symbols = await prisma.exchangeSymbol.findMany({
        where: whereClause,
        orderBy: [
          { baseAsset: 'asc' },
          { exchange: 'asc' }
        ],
        take: Math.min(limit, 100), // 限制最大查询数量
        select: {
          id: true,
          symbol: true,
          baseAsset: true,
          quoteAsset: true,
          exchange: true,
          status: true,
          isSpotTradingAllowed: true,
          baseAssetPrecision: true,
          quotePrecision: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return symbols;
    } catch (error) {
      Logger.error('搜索币种信息失败', { error, query });
      throw new Error('Failed to search symbols');
    }
  }

  /**
   * 获取所有可用的币种列表（用于收藏功能）
   */
  static async getAllAvailableSymbols(limit: number = 1000, exchanges?: string[]): Promise<any[]> {
    try {
      const whereClause: any = {
        status: 'TRADING',
        isSpotTradingAllowed: true
      };

      if (exchanges && exchanges.length > 0) {
        whereClause.exchange = { in: exchanges };
      }

      const symbols = await prisma.exchangeSymbol.findMany({
        where: whereClause,
        orderBy: [
          { baseAsset: 'asc' },
          { exchange: 'asc' }
        ],
        take: limit,
        select: {
          symbol: true,
          baseAsset: true,
          quoteAsset: true,
          exchange: true,
          updatedAt: true
        }
      });

      return symbols;
    } catch (error) {
      Logger.error('获取可用币种列表失败', { error });
      throw new Error('Failed to get available symbols');
    }
  }

  /**
   * 定期更新币种信息任务
   */
  static async updateSymbolsTask(): Promise<void> {
    try {
      Logger.info('开始执行币种信息更新任务');
      
      const symbols = await this.fetchAllExchangeSymbols();
      if (symbols.length > 0) {
        await this.saveSymbolsToDatabase(symbols);
        Logger.info('币种信息更新任务完成');
      } else {
        Logger.warn('未获取到任何币种信息');
      }
    } catch (error) {
      Logger.error('币种信息更新任务失败', { error });
      throw error;
    }
  }
}