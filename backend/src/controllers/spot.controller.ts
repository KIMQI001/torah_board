import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { MarketDataService } from '@/services/market-data.service';
import { CEXAnnouncementsService } from '@/services/cex-announcements.service';
import { PriceAlertsService } from '@/services/price-alerts.service';
import { realTimePriceManager, AggregatedPriceUpdate } from '@/services/realtime-price-manager.service';
import { ExchangeSymbolsService } from '@/services/exchange-symbols.service';
import { NewsFeedsService } from '@/services/news-feeds.service';
import { OnChainFeedsService } from '@/services/onchain-feeds.service';
import { AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/services/database';

export class SpotController {
  /**
   * 获取市场数据
   */
  static async getMarketData(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbols, exchange, limit = 50 } = req.query;
      
      let symbolList: string[] | undefined;
      if (symbols) {
        symbolList = Array.isArray(symbols) ? symbols as string[] : [symbols as string];
      }

      let marketData;
      if (exchange) {
        switch (exchange) {
          case 'binance':
            marketData = await MarketDataService.getBinanceData(symbolList);
            break;
          case 'okx':
            marketData = await MarketDataService.getOKXData(symbolList);
            break;
          case 'gate':
            marketData = await MarketDataService.getGateData(symbolList);
            break;
          default:
            marketData = await MarketDataService.getAggregatedMarketData(symbolList);
        }
      } else {
        marketData = await MarketDataService.getAggregatedMarketData(symbolList);
      }

      // 限制返回数量
      const limitedData = marketData.slice(0, Number(limit));

      ResponseUtil.success(res, limitedData, 'Market data retrieved successfully');
    } catch (error) {
      Logger.error('Failed to fetch market data', { error });
      ResponseUtil.error(res, 'Failed to fetch market data');
    }
  }

  /**
   * 获取特定交易对数据
   */
  static async getSymbolData(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol } = req.params;
      const { exchange } = req.query;

      let symbolData;
      if (exchange) {
        switch (exchange) {
          case 'binance':
            symbolData = await MarketDataService.getBinanceData([symbol]);
            break;
          case 'okx':
            symbolData = await MarketDataService.getOKXData([symbol]);
            break;
          case 'gate':
            symbolData = await MarketDataService.getGateData([symbol]);
            break;
          default:
            symbolData = await MarketDataService.getAggregatedMarketData([symbol]);
        }
      } else {
        symbolData = await MarketDataService.getAggregatedMarketData([symbol]);
      }

      if (symbolData.length === 0) {
        ResponseUtil.notFound(res, 'Symbol not found');
        return;
      }

      ResponseUtil.success(res, symbolData, 'Symbol data retrieved successfully');
    } catch (error) {
      Logger.error('Failed to fetch symbol data', { error, symbol: req.params.symbol });
      ResponseUtil.error(res, 'Failed to fetch symbol data');
    }
  }

  /**
   * 获取价格对比
   */
  static async getPriceComparison(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol } = req.params;
      
      const comparison = await MarketDataService.getPriceComparison(symbol);
      
      ResponseUtil.success(res, comparison, 'Price comparison retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get price comparison', { error, symbol: req.params.symbol });
      ResponseUtil.error(res, 'Failed to get price comparison');
    }
  }

  /**
   * 获取订单簿
   */
  static async getOrderBook(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol } = req.params;
      const { exchange = 'binance', limit = 20 } = req.query;

      let orderBook;
      switch (exchange) {
        case 'binance':
          orderBook = await MarketDataService.getBinanceOrderBook(symbol, Number(limit));
          break;
        default:
          ResponseUtil.error(res, 'Exchange not supported for order book data');
          return;
      }

      ResponseUtil.success(res, orderBook, 'Order book retrieved successfully');
    } catch (error) {
      Logger.error('Failed to fetch order book', { error, symbol: req.params.symbol });
      ResponseUtil.error(res, 'Failed to fetch order book');
    }
  }

  /**
   * 获取价格预警
   */
  static async getPriceAlerts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { active } = req.query;
      const alerts = await PriceAlertsService.getUserAlerts(userId, active === 'true');

      ResponseUtil.success(res, alerts, 'Price alerts retrieved successfully');
    } catch (error) {
      Logger.error('Failed to fetch price alerts', { error });
      ResponseUtil.error(res, 'Failed to fetch price alerts');
    }
  }

  /**
   * 创建价格预警
   */
  static async createPriceAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { symbol, targetPrice, condition, exchange, message } = req.body;

      if (!symbol || !targetPrice || !condition) {
        ResponseUtil.error(res, 'Missing required fields: symbol, targetPrice, condition');
        return;
      }

      const alert = await PriceAlertsService.createAlert({
        userId,
        symbol,
        targetPrice: parseFloat(targetPrice),
        condition,
        exchange: exchange || 'binance',
        message: message || `Price alert for ${symbol}`
      });

      ResponseUtil.success(res, alert, 'Price alert created successfully');
    } catch (error) {
      Logger.error('Failed to create price alert', { error });
      ResponseUtil.error(res, 'Failed to create price alert');
    }
  }

  /**
   * 更新价格预警
   */
  static async updatePriceAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      const alert = await PriceAlertsService.updateAlert(id, userId, updates);

      ResponseUtil.success(res, alert, 'Price alert updated successfully');
    } catch (error) {
      Logger.error('Failed to update price alert', { error, alertId: req.params.id });
      ResponseUtil.error(res, 'Failed to update price alert');
    }
  }

  /**
   * 删除价格预警
   */
  static async deletePriceAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;

      await PriceAlertsService.deleteAlert(id, userId);

      ResponseUtil.success(res, null, 'Price alert deleted successfully');
    } catch (error) {
      Logger.error('Failed to delete price alert', { error, alertId: req.params.id });
      ResponseUtil.error(res, 'Failed to delete price alert');
    }
  }

  /**
   * 获取CEX公告
   */
  static async getAnnouncements(req: AuthenticatedRequest, res: Response) {
    try {
      const { exchange, category, importance, limit } = req.query;

      const filter = {
        ...(exchange && { exchange: exchange as string }),
        ...(category && { category: category as string }),
        ...(importance && { importance: importance as 'high' | 'medium' | 'low' }),
        ...(limit && { limit: Number(limit) })
      };

      const announcements = await CEXAnnouncementsService.getAllAnnouncements(filter);

      ResponseUtil.success(res, announcements, 'Announcements retrieved successfully');
    } catch (error) {
      Logger.error('Failed to fetch announcements', { error });
      ResponseUtil.error(res, 'Failed to fetch announcements');
    }
  }

  /**
   * 获取高优先级公告
   */
  static async getHighPriorityAnnouncements(req: AuthenticatedRequest, res: Response) {
    try {
      const announcements = await CEXAnnouncementsService.getHighPriorityAnnouncements();

      ResponseUtil.success(res, announcements, 'High priority announcements retrieved successfully');
    } catch (error) {
      Logger.error('Failed to fetch high priority announcements', { error });
      ResponseUtil.error(res, 'Failed to fetch high priority announcements');
    }
  }

  /**
   * 获取特定币种公告
   */
  static async getTokenAnnouncements(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol } = req.params;

      const announcements = await CEXAnnouncementsService.getTokenRelatedAnnouncements(symbol);

      ResponseUtil.success(res, announcements, `Announcements for ${symbol} retrieved successfully`);
    } catch (error) {
      Logger.error('Failed to fetch token announcements', { error, symbol: req.params.symbol });
      ResponseUtil.error(res, 'Failed to fetch token announcements');
    }
  }

  /**
   * 测试新爬虫服务 - 获取真实CEX公告
   */
  static async testCexScraper(req: AuthenticatedRequest, res: Response) {
    try {
      Logger.info('🔥 开始测试新爬虫服务...');
      
      // 使用新的爬虫服务获取数据
      const announcements = await CEXAnnouncementsService.getAnnouncementsWithScraper();
      
      ResponseUtil.success(res, {
        total: announcements.length,
        announcements,
        message: '新爬虫服务测试成功',
        timestamp: Date.now()
      }, 'CEX scraper test completed successfully');
    } catch (error) {
      Logger.error('CEX爬虫服务测试失败', { error });
      ResponseUtil.error(res, 'CEX scraper test failed');
    }
  }

  /**
   * 测试Binance新爬虫
   */
  static async testBinanceScraper(req: AuthenticatedRequest, res: Response) {
    try {
      Logger.info('🚀 测试Binance新版爬虫...');
      
      const announcements = await CEXAnnouncementsService.getBinanceAnnouncementsV2();
      
      ResponseUtil.success(res, {
        exchange: 'binance',
        total: announcements.length,
        announcements,
        message: 'Binance新版爬虫测试成功',
        timestamp: Date.now()
      }, 'Binance scraper test completed successfully');
    } catch (error) {
      Logger.error('Binance爬虫测试失败', { error });
      ResponseUtil.error(res, 'Binance scraper test failed');
    }
  }

  /**
   * 测试OKX新爬虫
   */
  static async testOkxScraper(req: AuthenticatedRequest, res: Response) {
    try {
      Logger.info('🚀 测试OKX新版爬虫...');
      
      const announcements = await CEXAnnouncementsService.getOKXAnnouncementsV2();
      
      ResponseUtil.success(res, {
        exchange: 'okx',
        total: announcements.length,
        announcements,
        message: 'OKX新版爬虫测试成功',
        timestamp: Date.now()
      }, 'OKX scraper test completed successfully');
    } catch (error) {
      Logger.error('OKX爬虫测试失败', { error });
      ResponseUtil.error(res, 'OKX scraper test failed');
    }
  }

  /**
   * 测试专门的网页爬虫服务
   */
  static async testWebScraper(req: AuthenticatedRequest, res: Response) {
    try {
      Logger.info('🕷️ 测试专门网页爬虫服务...');
      
      // 动态导入网页爬虫服务
      const { WebScraperService } = await import('../services/web-scraper.service');
      const announcements = await WebScraperService.scrapeAllWeb();
      
      // 转换为标准格式
      const formattedAnnouncements = announcements.map(scraped => ({
        id: scraped.id,
        exchange: scraped.exchange,
        title: scraped.title,
        content: scraped.content,
        category: scraped.category,
        importance: scraped.importance,
        publishTime: scraped.publishTime,
        tags: scraped.tags,
        url: scraped.url
      }));
      
      ResponseUtil.success(res, {
        total: formattedAnnouncements.length,
        announcements: formattedAnnouncements,
        message: '专门网页爬虫测试成功',
        timestamp: Date.now(),
        method: '网页HTML解析'
      }, 'Web scraper test completed successfully');
    } catch (error) {
      Logger.error('网页爬虫测试失败', { error });
      ResponseUtil.error(res, 'Web scraper test failed');
    }
  }

  /**
   * 获取价格异常
   */
  static async getPriceAnomalies(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbols } = req.query;
      
      let symbolList: string[] | undefined;
      if (symbols) {
        symbolList = Array.isArray(symbols) ? symbols as string[] : [symbols as string];
      }

      const currentData = await MarketDataService.getAggregatedMarketData(symbolList);
      
      // 这里应该从数据库或缓存中获取历史数据
      // 暂时使用当前数据作为历史数据的示例
      const historicalData = currentData.map(item => ({
        ...item,
        timestamp: item.timestamp - 3600000, // 1 hour ago
        quoteVolume: item.quoteVolume * 0.8 // 模拟历史成交量
      }));

      const anomalies = MarketDataService.detectPriceAnomalies(currentData, historicalData);

      ResponseUtil.success(res, anomalies, 'Price anomalies retrieved successfully');
    } catch (error) {
      Logger.error('Failed to detect price anomalies', { error });
      ResponseUtil.error(res, 'Failed to detect price anomalies');
    }
  }

  /**
   * 获取市场概览
   */
  static async getMarketOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const marketData = await MarketDataService.getAggregatedMarketData();
      
      // 计算市场统计
      const totalVolume = marketData.reduce((sum, item) => sum + item.quoteVolume, 0);
      const gainers = marketData.filter(item => item.priceChangePercent > 0).length;
      const losers = marketData.filter(item => item.priceChangePercent < 0).length;
      const unchanged = marketData.filter(item => item.priceChangePercent === 0).length;

      const overview = {
        totalPairs: marketData.length,
        totalVolume24h: totalVolume,
        gainers,
        losers,
        unchanged,
        topGainer: marketData.reduce((prev, current) => 
          prev.priceChangePercent > current.priceChangePercent ? prev : current
        ),
        topLoser: marketData.reduce((prev, current) => 
          prev.priceChangePercent < current.priceChangePercent ? prev : current
        ),
        timestamp: Date.now()
      };

      ResponseUtil.success(res, overview, 'Market overview retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get market overview', { error });
      ResponseUtil.error(res, 'Failed to get market overview');
    }
  }

  /**
   * 获取热门币种
   */
  static async getTrendingTokens(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit = 20 } = req.query;
      
      const marketData = await MarketDataService.getAggregatedMarketData();
      
      // 去重：为每个交易对选择成交量最大的数据
      const uniqueSymbols = new Map();
      marketData.forEach(item => {
        const existing = uniqueSymbols.get(item.symbol);
        if (!existing || item.quoteVolume > existing.quoteVolume) {
          uniqueSymbols.set(item.symbol, item);
        }
      });
      
      // 按成交量排序获取热门币种
      const trending = Array.from(uniqueSymbols.values())
        .sort((a, b) => b.quoteVolume - a.quoteVolume)
        .slice(0, Number(limit));

      ResponseUtil.success(res, trending, 'Trending tokens retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get trending tokens', { error });
      ResponseUtil.error(res, 'Failed to get trending tokens');
    }
  }

  /**
   * 获取涨幅榜
   */
  static async getTopGainers(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit = 20 } = req.query;
      
      const marketData = await MarketDataService.getAggregatedMarketData();
      
      // 去重：为每个交易对选择成交量最大的数据
      const uniqueSymbols = new Map();
      marketData.forEach(item => {
        const existing = uniqueSymbols.get(item.symbol);
        if (!existing || item.quoteVolume > existing.quoteVolume) {
          uniqueSymbols.set(item.symbol, item);
        }
      });
      
      const gainers = Array.from(uniqueSymbols.values())
        .filter(item => item.priceChangePercent > 0)
        .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
        .slice(0, Number(limit));

      ResponseUtil.success(res, gainers, 'Top gainers retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get top gainers', { error });
      ResponseUtil.error(res, 'Failed to get top gainers');
    }
  }

  /**
   * 获取跌幅榜
   */
  static async getTopLosers(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit = 20 } = req.query;
      
      const marketData = await MarketDataService.getAggregatedMarketData();
      
      // 去重：为每个交易对选择成交量最大的数据
      const uniqueSymbols = new Map();
      marketData.forEach(item => {
        const existing = uniqueSymbols.get(item.symbol);
        if (!existing || item.quoteVolume > existing.quoteVolume) {
          uniqueSymbols.set(item.symbol, item);
        }
      });
      
      const losers = Array.from(uniqueSymbols.values())
        .filter(item => item.priceChangePercent < 0)
        .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
        .slice(0, Number(limit));

      ResponseUtil.success(res, losers, 'Top losers retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get top losers', { error });
      ResponseUtil.error(res, 'Failed to get top losers');
    }
  }

  /**
   * 启动实时价格监控
   */
  static async startRealTimeTracking(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols)) {
        return ResponseUtil.error(res, 'Invalid symbols provided');
      }

      realTimePriceManager.startRealTimePriceTracking(symbols);
      
      ResponseUtil.success(res, { symbols }, 'Real-time price tracking started');
    } catch (error) {
      Logger.error('Failed to start real-time tracking', { error });
      ResponseUtil.error(res, 'Failed to start real-time tracking');
    }
  }

  /**
   * 停止实时价格监控
   */
  static async stopRealTimeTracking(req: AuthenticatedRequest, res: Response) {
    try {
      realTimePriceManager.stopRealTimePriceTracking();
      ResponseUtil.success(res, {}, 'Real-time price tracking stopped');
    } catch (error) {
      Logger.error('Failed to stop real-time tracking', { error });
      ResponseUtil.error(res, 'Failed to stop real-time tracking');
    }
  }

  /**
   * 获取实时价格流 - Server-Sent Events
   */
  static async getRealTimePriceStream(req: AuthenticatedRequest, res: Response) {
    try {
      // 设置SSE头部
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // 发送初始连接确认
      res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

      // 监听价格更新事件
      const handlePriceUpdate = (update: AggregatedPriceUpdate) => {
        const eventData = {
          type: 'priceUpdate',
          data: update,
          timestamp: Date.now()
        };
        
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      };

      realTimePriceManager.on('aggregatedPriceUpdate', handlePriceUpdate);

      // 发送心跳
      const heartbeat = setInterval(() => {
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
      }, 30000);

      // 客户端断开连接时清理
      req.on('close', () => {
        realTimePriceManager.off('aggregatedPriceUpdate', handlePriceUpdate);
        clearInterval(heartbeat);
        Logger.info('Real-time price stream client disconnected');
      });

    } catch (error) {
      Logger.error('Failed to setup real-time price stream', { error });
      ResponseUtil.error(res, 'Failed to setup real-time price stream');
    }
  }

  /**
   * 获取聚合价格数据
   */
  static async getAggregatedPrices(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbols } = req.query;
      
      if (symbols) {
        const symbolList = Array.isArray(symbols) ? symbols as string[] : [symbols as string];
        const prices = symbolList.map(symbol => 
          realTimePriceManager.getAggregatedPrice(symbol)
        ).filter(Boolean);
        
        ResponseUtil.success(res, prices, 'Aggregated prices retrieved successfully');
      } else {
        const allPrices = realTimePriceManager.getAllAggregatedPrices();
        ResponseUtil.success(res, allPrices, 'All aggregated prices retrieved successfully');
      }
    } catch (error) {
      Logger.error('Failed to get aggregated prices', { error });
      ResponseUtil.error(res, 'Failed to get aggregated prices');
    }
  }

  /**
   * 获取实时监控状态
   */
  static async getRealTimeStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const status = realTimePriceManager.getStatus();
      ResponseUtil.success(res, status, 'Real-time status retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get real-time status', { error });
      ResponseUtil.error(res, 'Failed to get real-time status');
    }
  }

  /**
   * 添加监控交易对
   */
  static async addSymbolsToTracking(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols)) {
        return ResponseUtil.error(res, 'Invalid symbols provided');
      }

      realTimePriceManager.addSymbols(symbols);
      
      ResponseUtil.success(res, { symbols }, 'Symbols added to real-time tracking');
    } catch (error) {
      Logger.error('Failed to add symbols to tracking', { error });
      ResponseUtil.error(res, 'Failed to add symbols to tracking');
    }
  }

  /**
   * 移除监控交易对
   */
  static async removeSymbolsFromTracking(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols)) {
        return ResponseUtil.error(res, 'Invalid symbols provided');
      }

      realTimePriceManager.removeSymbols(symbols);
      
      ResponseUtil.success(res, { symbols }, 'Symbols removed from real-time tracking');
    } catch (error) {
      Logger.error('Failed to remove symbols from tracking', { error });
      ResponseUtil.error(res, 'Failed to remove symbols from tracking');
    }
  }

  /**
   * 重新连接WebSocket
   */
  static async reconnectWebSocket(req: AuthenticatedRequest, res: Response) {
    try {
      realTimePriceManager.reconnectWebSocket();
      ResponseUtil.success(res, {}, 'WebSocket reconnection initiated');
    } catch (error) {
      Logger.error('Failed to reconnect WebSocket', { error });
      ResponseUtil.error(res, 'Failed to reconnect WebSocket');
    }
  }

  /**
   * 获取用户关注的币种
   */
  static async getFavoriteSymbols(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return ResponseUtil.unauthorized(res, 'User not authenticated');
      }

      const favorites = await prisma.favoriteSymbol.findMany({
        where: { userId: user.id },
        orderBy: { addedAt: 'desc' }
      });

      // 获取这些币种的实时数据
      if (favorites.length > 0) {
        const symbols = favorites.map(f => f.symbol);
        const marketData = await MarketDataService.getAggregatedMarketData(symbols);
        
        const favoritesWithData = favorites.map(favorite => {
          const ticker = marketData.find(t => t.symbol === favorite.symbol);
          return {
            ...favorite,
            marketData: ticker || null
          };
        });

        ResponseUtil.success(res, favoritesWithData, 'Favorite symbols retrieved successfully');
      } else {
        ResponseUtil.success(res, [], 'No favorite symbols found');
      }
    } catch (error) {
      Logger.error('Failed to get favorite symbols', { error });
      ResponseUtil.error(res, 'Failed to get favorite symbols');
    }
  }

  /**
   * 添加关注币种
   */
  static async addFavoriteSymbol(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return ResponseUtil.unauthorized(res, 'User not authenticated');
      }

      const { symbol, baseAsset, quoteAsset } = req.body;

      if (!symbol || !baseAsset || !quoteAsset) {
        return ResponseUtil.error(res, 'Missing required fields');
      }

      // 检查是否已经存在
      const existing = await prisma.favoriteSymbol.findUnique({
        where: {
          userId_symbol: {
            userId: user.id,
            symbol
          }
        }
      });

      if (existing) {
        return ResponseUtil.error(res, 'Symbol already in favorites');
      }

      const favorite = await prisma.favoriteSymbol.create({
        data: {
          userId: user.id,
          symbol,
          baseAsset,
          quoteAsset
        }
      });

      ResponseUtil.success(res, favorite, 'Symbol added to favorites');
    } catch (error) {
      Logger.error('Failed to add favorite symbol', { error });
      ResponseUtil.error(res, 'Failed to add favorite symbol');
    }
  }

  /**
   * 移除关注币种
   */
  static async removeFavoriteSymbol(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return ResponseUtil.unauthorized(res, 'User not authenticated');
      }

      const { symbol } = req.params;

      await prisma.favoriteSymbol.deleteMany({
        where: {
          userId: user.id,
          symbol
        }
      });

      ResponseUtil.success(res, { symbol }, 'Symbol removed from favorites');
    } catch (error) {
      Logger.error('Failed to remove favorite symbol', { error });
      ResponseUtil.error(res, 'Failed to remove favorite symbol');
    }
  }

  /**
   * 搜索交易所币种（从本地数据库）
   */
  static async searchExchangeSymbols(req: AuthenticatedRequest, res: Response) {
    try {
      const { q = '', limit = 50, exchanges } = req.query;
      
      let exchangeList: string[] | undefined;
      if (exchanges) {
        exchangeList = Array.isArray(exchanges) ? exchanges as string[] : [exchanges as string];
      }

      const symbols = await ExchangeSymbolsService.searchSymbols(
        q as string, 
        Number(limit), 
        exchangeList
      );

      ResponseUtil.success(res, symbols, 'Exchange symbols retrieved successfully');
    } catch (error) {
      Logger.error('Failed to search exchange symbols', { error });
      ResponseUtil.error(res, 'Failed to search exchange symbols');
    }
  }

  /**
   * 获取所有可用的交易所币种
   */
  static async getAllExchangeSymbols(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit = 1000, exchanges } = req.query;
      
      let exchangeList: string[] | undefined;
      if (exchanges) {
        exchangeList = Array.isArray(exchanges) ? exchanges as string[] : [exchanges as string];
      }

      const symbols = await ExchangeSymbolsService.getAllAvailableSymbols(
        Number(limit), 
        exchangeList
      );

      ResponseUtil.success(res, symbols, 'Available symbols retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get available symbols', { error });
      ResponseUtil.error(res, 'Failed to get available symbols');
    }
  }

  /**
   * 手动更新交易所币种信息
   */
  static async updateExchangeSymbols(req: AuthenticatedRequest, res: Response) {
    try {
      Logger.info('Manual exchange symbols update initiated');
      
      await ExchangeSymbolsService.updateSymbolsTask();
      
      ResponseUtil.success(res, { 
        message: 'Exchange symbols update completed',
        timestamp: new Date().toISOString()
      }, 'Exchange symbols updated successfully');
    } catch (error) {
      Logger.error('Failed to update exchange symbols', { error });
      ResponseUtil.error(res, 'Failed to update exchange symbols');
    }
  }

  /**
   * 获取交易所币种统计信息
   */
  static async getExchangeSymbolsStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await prisma.exchangeSymbol.groupBy({
        by: ['exchange'],
        _count: {
          symbol: true
        },
        where: {
          status: 'TRADING'
        }
      });

      const totalCount = await prisma.exchangeSymbol.count({
        where: { status: 'TRADING' }
      });

      const lastUpdated = await prisma.exchangeSymbol.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      });

      const exchangeStats = stats.map(stat => ({
        exchange: stat.exchange,
        symbolCount: stat._count.symbol
      }));

      const result = {
        totalSymbols: totalCount,
        byExchange: exchangeStats,
        lastUpdated: lastUpdated?.updatedAt || null
      };

      ResponseUtil.success(res, result, 'Exchange symbols statistics retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get exchange symbols stats', { error });
      ResponseUtil.error(res, 'Failed to get exchange symbols statistics');
    }
  }

  // ==================== News Feeds API Methods ====================

  /**
   * 获取聚合快讯
   */
  static async getNewsFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        sources, 
        categories, 
        importance, 
        symbols, 
        exchanges, 
        isHot,
        limit = 20, 
        offset = 0 
      } = req.query;

      const filter = {
        ...(sources && { sources: Array.isArray(sources) ? sources as string[] : [sources as string] }),
        ...(categories && { categories: Array.isArray(categories) ? categories as string[] : [categories as string] }),
        ...(importance && { importance: importance as 'high' | 'medium' | 'low' }),
        ...(symbols && { symbols: Array.isArray(symbols) ? symbols as string[] : [symbols as string] }),
        ...(exchanges && { exchanges: Array.isArray(exchanges) ? exchanges as string[] : [exchanges as string] }),
        ...(isHot !== undefined && { isHot: isHot === 'true' }),
        limit: Number(limit),
        offset: Number(offset)
      };

      const feeds = await NewsFeedsService.aggregateFeeds(filter);
      
      ResponseUtil.success(res, feeds, 'News feeds retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get news feeds', { error });
      ResponseUtil.error(res, 'Failed to get news feeds');
    }
  }

  /**
   * 获取热门快讯
   */
  static async getHotNewsFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit = 15 } = req.query;
      const feeds = await NewsFeedsService.getHotFeeds(Number(limit));
      
      ResponseUtil.success(res, feeds, 'Hot news feeds retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get hot news feeds', { error });
      ResponseUtil.error(res, 'Failed to get hot news feeds');
    }
  }

  /**
   * 获取链上数据快讯
   */
  static async getOnChainFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        blockchain, 
        eventType, 
        minValue, 
        tokenSymbol, 
        alertsOnly,
        limit = 20, 
        offset = 0 
      } = req.query;

      const filter = {
        ...(blockchain && { blockchain: blockchain as string }),
        ...(eventType && { eventType: eventType as string }),
        ...(minValue && { minValue: Number(minValue) }),
        ...(tokenSymbol && { tokenSymbol: tokenSymbol as string }),
        ...(alertsOnly !== undefined && { alertsOnly: alertsOnly === 'true' }),
        limit: Number(limit),
        offset: Number(offset)
      };

      const feeds = await OnChainFeedsService.getOnChainFeeds(filter);
      
      ResponseUtil.success(res, feeds, 'On-chain feeds retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get on-chain feeds', { error: error.message });
      ResponseUtil.error(res, 'Failed to get on-chain feeds');
    }
  }

  /**
   * 获取巨鲸活动
   */
  static async getWhaleActivity(req: AuthenticatedRequest, res: Response) {
    try {
      const feeds = await OnChainFeedsService.getWhaleActivity();
      
      ResponseUtil.success(res, feeds, 'Whale activity retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get whale activity', { error });
      ResponseUtil.error(res, 'Failed to get whale activity');
    }
  }

  /**
   * 获取特定币种相关快讯
   */
  static async getSymbolNewsFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol } = req.params;
      const { limit = 20 } = req.query;
      
      const feeds = await NewsFeedsService.getSymbolRelatedFeeds(symbol, Number(limit));
      
      ResponseUtil.success(res, feeds, `News feeds for ${symbol} retrieved successfully`);
    } catch (error) {
      Logger.error('Failed to get symbol news feeds', { error, symbol: req.params.symbol });
      ResponseUtil.error(res, 'Failed to get symbol news feeds');
    }
  }

  /**
   * 手动触发快讯聚合更新
   */
  static async triggerFeedsUpdate(req: AuthenticatedRequest, res: Response) {
    try {
      await NewsFeedsService.aggregateFeedsTask();
      
      ResponseUtil.success(res, { updated: true }, 'News feeds updated successfully');
    } catch (error) {
      Logger.error('Failed to trigger feeds update', { error });
      ResponseUtil.error(res, 'Failed to trigger feeds update');
    }
  }

  /**
   * 获取快讯统计信息
   */
  static async getFeedsStats(req: AuthenticatedRequest, res: Response) {
    try {
      const [
        totalFeeds,
        hotFeeds,
        sourceStats,
        categoryStats
      ] = await Promise.all([
        prisma.newsFeed.count(),
        prisma.newsFeed.count({ where: { isHot: true } }),
        prisma.newsFeed.groupBy({
          by: ['source'],
          _count: { id: true }
        }),
        prisma.newsFeed.groupBy({
          by: ['category'],
          _count: { id: true }
        })
      ]);

      const recentCount = await prisma.newsFeed.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
          }
        }
      });

      const result = {
        totalFeeds,
        hotFeeds,
        recentFeeds: recentCount,
        sources: sourceStats.map(stat => ({
          source: stat.source,
          count: stat._count.id
        })),
        categories: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.id
        }))
      };

      ResponseUtil.success(res, result, 'Feeds statistics retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get feeds stats', { error });
      ResponseUtil.error(res, 'Failed to get feeds statistics');
    }
  }
}