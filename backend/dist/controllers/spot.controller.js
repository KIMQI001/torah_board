"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const market_data_service_1 = require("@/services/market-data.service");
const cex_announcements_service_1 = require("@/services/cex-announcements.service");
const price_alerts_service_1 = require("@/services/price-alerts.service");
const realtime_price_manager_service_1 = require("@/services/realtime-price-manager.service");
const exchange_symbols_service_1 = require("@/services/exchange-symbols.service");
const database_1 = require("@/services/database");
class SpotController {
    /**
     * 获取市场数据
     */
    static async getMarketData(req, res) {
        try {
            const { symbols, exchange, limit = 50 } = req.query;
            let symbolList;
            if (symbols) {
                symbolList = Array.isArray(symbols) ? symbols : [symbols];
            }
            let marketData;
            if (exchange) {
                switch (exchange) {
                    case 'binance':
                        marketData = await market_data_service_1.MarketDataService.getBinanceData(symbolList);
                        break;
                    case 'okx':
                        marketData = await market_data_service_1.MarketDataService.getOKXData(symbolList);
                        break;
                    case 'gate':
                        marketData = await market_data_service_1.MarketDataService.getGateData(symbolList);
                        break;
                    default:
                        marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData(symbolList);
                }
            }
            else {
                marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData(symbolList);
            }
            // 限制返回数量
            const limitedData = marketData.slice(0, Number(limit));
            response_1.ResponseUtil.success(res, limitedData, 'Market data retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch market data', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch market data');
        }
    }
    /**
     * 获取特定交易对数据
     */
    static async getSymbolData(req, res) {
        try {
            const { symbol } = req.params;
            const { exchange } = req.query;
            let symbolData;
            if (exchange) {
                switch (exchange) {
                    case 'binance':
                        symbolData = await market_data_service_1.MarketDataService.getBinanceData([symbol]);
                        break;
                    case 'okx':
                        symbolData = await market_data_service_1.MarketDataService.getOKXData([symbol]);
                        break;
                    case 'gate':
                        symbolData = await market_data_service_1.MarketDataService.getGateData([symbol]);
                        break;
                    default:
                        symbolData = await market_data_service_1.MarketDataService.getAggregatedMarketData([symbol]);
                }
            }
            else {
                symbolData = await market_data_service_1.MarketDataService.getAggregatedMarketData([symbol]);
            }
            if (symbolData.length === 0) {
                response_1.ResponseUtil.notFound(res, 'Symbol not found');
                return;
            }
            response_1.ResponseUtil.success(res, symbolData, 'Symbol data retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch symbol data', { error, symbol: req.params.symbol });
            response_1.ResponseUtil.error(res, 'Failed to fetch symbol data');
        }
    }
    /**
     * 获取价格对比
     */
    static async getPriceComparison(req, res) {
        try {
            const { symbol } = req.params;
            const comparison = await market_data_service_1.MarketDataService.getPriceComparison(symbol);
            response_1.ResponseUtil.success(res, comparison, 'Price comparison retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get price comparison', { error, symbol: req.params.symbol });
            response_1.ResponseUtil.error(res, 'Failed to get price comparison');
        }
    }
    /**
     * 获取订单簿
     */
    static async getOrderBook(req, res) {
        try {
            const { symbol } = req.params;
            const { exchange = 'binance', limit = 20 } = req.query;
            let orderBook;
            switch (exchange) {
                case 'binance':
                    orderBook = await market_data_service_1.MarketDataService.getBinanceOrderBook(symbol, Number(limit));
                    break;
                default:
                    response_1.ResponseUtil.error(res, 'Exchange not supported for order book data');
                    return;
            }
            response_1.ResponseUtil.success(res, orderBook, 'Order book retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch order book', { error, symbol: req.params.symbol });
            response_1.ResponseUtil.error(res, 'Failed to fetch order book');
        }
    }
    /**
     * 获取价格预警
     */
    static async getPriceAlerts(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { active } = req.query;
            const alerts = await price_alerts_service_1.PriceAlertsService.getUserAlerts(userId, active === 'true');
            response_1.ResponseUtil.success(res, alerts, 'Price alerts retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch price alerts', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch price alerts');
        }
    }
    /**
     * 创建价格预警
     */
    static async createPriceAlert(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { symbol, targetPrice, condition, exchange, message } = req.body;
            if (!symbol || !targetPrice || !condition) {
                response_1.ResponseUtil.error(res, 'Missing required fields: symbol, targetPrice, condition');
                return;
            }
            const alert = await price_alerts_service_1.PriceAlertsService.createAlert({
                userId,
                symbol,
                targetPrice: parseFloat(targetPrice),
                condition,
                exchange: exchange || 'binance',
                message: message || `Price alert for ${symbol}`
            });
            response_1.ResponseUtil.success(res, alert, 'Price alert created successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to create price alert', { error });
            response_1.ResponseUtil.error(res, 'Failed to create price alert');
        }
    }
    /**
     * 更新价格预警
     */
    static async updatePriceAlert(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            const updates = req.body;
            const alert = await price_alerts_service_1.PriceAlertsService.updateAlert(id, userId, updates);
            response_1.ResponseUtil.success(res, alert, 'Price alert updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to update price alert', { error, alertId: req.params.id });
            response_1.ResponseUtil.error(res, 'Failed to update price alert');
        }
    }
    /**
     * 删除价格预警
     */
    static async deletePriceAlert(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { id } = req.params;
            await price_alerts_service_1.PriceAlertsService.deleteAlert(id, userId);
            response_1.ResponseUtil.success(res, null, 'Price alert deleted successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to delete price alert', { error, alertId: req.params.id });
            response_1.ResponseUtil.error(res, 'Failed to delete price alert');
        }
    }
    /**
     * 获取CEX公告
     */
    static async getAnnouncements(req, res) {
        try {
            const { exchange, category, importance, limit } = req.query;
            const filter = {
                ...(exchange && { exchange: exchange }),
                ...(category && { category: category }),
                ...(importance && { importance: importance }),
                ...(limit && { limit: Number(limit) })
            };
            const announcements = await cex_announcements_service_1.CEXAnnouncementsService.getAllAnnouncements(filter);
            response_1.ResponseUtil.success(res, announcements, 'Announcements retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch announcements', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch announcements');
        }
    }
    /**
     * 获取高优先级公告
     */
    static async getHighPriorityAnnouncements(req, res) {
        try {
            const announcements = await cex_announcements_service_1.CEXAnnouncementsService.getHighPriorityAnnouncements();
            response_1.ResponseUtil.success(res, announcements, 'High priority announcements retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch high priority announcements', { error });
            response_1.ResponseUtil.error(res, 'Failed to fetch high priority announcements');
        }
    }
    /**
     * 获取特定币种公告
     */
    static async getTokenAnnouncements(req, res) {
        try {
            const { symbol } = req.params;
            const announcements = await cex_announcements_service_1.CEXAnnouncementsService.getTokenRelatedAnnouncements(symbol);
            response_1.ResponseUtil.success(res, announcements, `Announcements for ${symbol} retrieved successfully`);
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch token announcements', { error, symbol: req.params.symbol });
            response_1.ResponseUtil.error(res, 'Failed to fetch token announcements');
        }
    }
    /**
     * 获取价格异常
     */
    static async getPriceAnomalies(req, res) {
        try {
            const { symbols } = req.query;
            let symbolList;
            if (symbols) {
                symbolList = Array.isArray(symbols) ? symbols : [symbols];
            }
            const currentData = await market_data_service_1.MarketDataService.getAggregatedMarketData(symbolList);
            // 这里应该从数据库或缓存中获取历史数据
            // 暂时使用当前数据作为历史数据的示例
            const historicalData = currentData.map(item => ({
                ...item,
                timestamp: item.timestamp - 3600000, // 1 hour ago
                quoteVolume: item.quoteVolume * 0.8 // 模拟历史成交量
            }));
            const anomalies = market_data_service_1.MarketDataService.detectPriceAnomalies(currentData, historicalData);
            response_1.ResponseUtil.success(res, anomalies, 'Price anomalies retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to detect price anomalies', { error });
            response_1.ResponseUtil.error(res, 'Failed to detect price anomalies');
        }
    }
    /**
     * 获取市场概览
     */
    static async getMarketOverview(req, res) {
        try {
            const marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData();
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
                topGainer: marketData.reduce((prev, current) => prev.priceChangePercent > current.priceChangePercent ? prev : current),
                topLoser: marketData.reduce((prev, current) => prev.priceChangePercent < current.priceChangePercent ? prev : current),
                timestamp: Date.now()
            };
            response_1.ResponseUtil.success(res, overview, 'Market overview retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get market overview', { error });
            response_1.ResponseUtil.error(res, 'Failed to get market overview');
        }
    }
    /**
     * 获取热门币种
     */
    static async getTrendingTokens(req, res) {
        try {
            const { limit = 20 } = req.query;
            const marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData();
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
            response_1.ResponseUtil.success(res, trending, 'Trending tokens retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get trending tokens', { error });
            response_1.ResponseUtil.error(res, 'Failed to get trending tokens');
        }
    }
    /**
     * 获取涨幅榜
     */
    static async getTopGainers(req, res) {
        try {
            const { limit = 20 } = req.query;
            const marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData();
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
            response_1.ResponseUtil.success(res, gainers, 'Top gainers retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get top gainers', { error });
            response_1.ResponseUtil.error(res, 'Failed to get top gainers');
        }
    }
    /**
     * 获取跌幅榜
     */
    static async getTopLosers(req, res) {
        try {
            const { limit = 20 } = req.query;
            const marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData();
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
            response_1.ResponseUtil.success(res, losers, 'Top losers retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get top losers', { error });
            response_1.ResponseUtil.error(res, 'Failed to get top losers');
        }
    }
    /**
     * 启动实时价格监控
     */
    static async startRealTimeTracking(req, res) {
        try {
            const { symbols } = req.body;
            if (!symbols || !Array.isArray(symbols)) {
                return response_1.ResponseUtil.error(res, 'Invalid symbols provided');
            }
            realtime_price_manager_service_1.realTimePriceManager.startRealTimePriceTracking(symbols);
            response_1.ResponseUtil.success(res, { symbols }, 'Real-time price tracking started');
        }
        catch (error) {
            logger_1.Logger.error('Failed to start real-time tracking', { error });
            response_1.ResponseUtil.error(res, 'Failed to start real-time tracking');
        }
    }
    /**
     * 停止实时价格监控
     */
    static async stopRealTimeTracking(req, res) {
        try {
            realtime_price_manager_service_1.realTimePriceManager.stopRealTimePriceTracking();
            response_1.ResponseUtil.success(res, {}, 'Real-time price tracking stopped');
        }
        catch (error) {
            logger_1.Logger.error('Failed to stop real-time tracking', { error });
            response_1.ResponseUtil.error(res, 'Failed to stop real-time tracking');
        }
    }
    /**
     * 获取实时价格流 - Server-Sent Events
     */
    static async getRealTimePriceStream(req, res) {
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
            const handlePriceUpdate = (update) => {
                const eventData = {
                    type: 'priceUpdate',
                    data: update,
                    timestamp: Date.now()
                };
                res.write(`data: ${JSON.stringify(eventData)}\n\n`);
            };
            realtime_price_manager_service_1.realTimePriceManager.on('aggregatedPriceUpdate', handlePriceUpdate);
            // 发送心跳
            const heartbeat = setInterval(() => {
                res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
            }, 30000);
            // 客户端断开连接时清理
            req.on('close', () => {
                realtime_price_manager_service_1.realTimePriceManager.off('aggregatedPriceUpdate', handlePriceUpdate);
                clearInterval(heartbeat);
                logger_1.Logger.info('Real-time price stream client disconnected');
            });
        }
        catch (error) {
            logger_1.Logger.error('Failed to setup real-time price stream', { error });
            response_1.ResponseUtil.error(res, 'Failed to setup real-time price stream');
        }
    }
    /**
     * 获取聚合价格数据
     */
    static async getAggregatedPrices(req, res) {
        try {
            const { symbols } = req.query;
            if (symbols) {
                const symbolList = Array.isArray(symbols) ? symbols : [symbols];
                const prices = symbolList.map(symbol => realtime_price_manager_service_1.realTimePriceManager.getAggregatedPrice(symbol)).filter(Boolean);
                response_1.ResponseUtil.success(res, prices, 'Aggregated prices retrieved successfully');
            }
            else {
                const allPrices = realtime_price_manager_service_1.realTimePriceManager.getAllAggregatedPrices();
                response_1.ResponseUtil.success(res, allPrices, 'All aggregated prices retrieved successfully');
            }
        }
        catch (error) {
            logger_1.Logger.error('Failed to get aggregated prices', { error });
            response_1.ResponseUtil.error(res, 'Failed to get aggregated prices');
        }
    }
    /**
     * 获取实时监控状态
     */
    static async getRealTimeStatus(req, res) {
        try {
            const status = realtime_price_manager_service_1.realTimePriceManager.getStatus();
            response_1.ResponseUtil.success(res, status, 'Real-time status retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get real-time status', { error });
            response_1.ResponseUtil.error(res, 'Failed to get real-time status');
        }
    }
    /**
     * 添加监控交易对
     */
    static async addSymbolsToTracking(req, res) {
        try {
            const { symbols } = req.body;
            if (!symbols || !Array.isArray(symbols)) {
                return response_1.ResponseUtil.error(res, 'Invalid symbols provided');
            }
            realtime_price_manager_service_1.realTimePriceManager.addSymbols(symbols);
            response_1.ResponseUtil.success(res, { symbols }, 'Symbols added to real-time tracking');
        }
        catch (error) {
            logger_1.Logger.error('Failed to add symbols to tracking', { error });
            response_1.ResponseUtil.error(res, 'Failed to add symbols to tracking');
        }
    }
    /**
     * 移除监控交易对
     */
    static async removeSymbolsFromTracking(req, res) {
        try {
            const { symbols } = req.body;
            if (!symbols || !Array.isArray(symbols)) {
                return response_1.ResponseUtil.error(res, 'Invalid symbols provided');
            }
            realtime_price_manager_service_1.realTimePriceManager.removeSymbols(symbols);
            response_1.ResponseUtil.success(res, { symbols }, 'Symbols removed from real-time tracking');
        }
        catch (error) {
            logger_1.Logger.error('Failed to remove symbols from tracking', { error });
            response_1.ResponseUtil.error(res, 'Failed to remove symbols from tracking');
        }
    }
    /**
     * 重新连接WebSocket
     */
    static async reconnectWebSocket(req, res) {
        try {
            realtime_price_manager_service_1.realTimePriceManager.reconnectWebSocket();
            response_1.ResponseUtil.success(res, {}, 'WebSocket reconnection initiated');
        }
        catch (error) {
            logger_1.Logger.error('Failed to reconnect WebSocket', { error });
            response_1.ResponseUtil.error(res, 'Failed to reconnect WebSocket');
        }
    }
    /**
     * 获取用户关注的币种
     */
    static async getFavoriteSymbols(req, res) {
        try {
            const { user } = req;
            if (!user) {
                return response_1.ResponseUtil.unauthorized(res, 'User not authenticated');
            }
            const favorites = await database_1.prisma.favoriteSymbol.findMany({
                where: { userId: user.id },
                orderBy: { addedAt: 'desc' }
            });
            // 获取这些币种的实时数据
            if (favorites.length > 0) {
                const symbols = favorites.map(f => f.symbol);
                const marketData = await market_data_service_1.MarketDataService.getAggregatedMarketData(symbols);
                const favoritesWithData = favorites.map(favorite => {
                    const ticker = marketData.find(t => t.symbol === favorite.symbol);
                    return {
                        ...favorite,
                        marketData: ticker || null
                    };
                });
                response_1.ResponseUtil.success(res, favoritesWithData, 'Favorite symbols retrieved successfully');
            }
            else {
                response_1.ResponseUtil.success(res, [], 'No favorite symbols found');
            }
        }
        catch (error) {
            logger_1.Logger.error('Failed to get favorite symbols', { error });
            response_1.ResponseUtil.error(res, 'Failed to get favorite symbols');
        }
    }
    /**
     * 添加关注币种
     */
    static async addFavoriteSymbol(req, res) {
        try {
            const { user } = req;
            if (!user) {
                return response_1.ResponseUtil.unauthorized(res, 'User not authenticated');
            }
            const { symbol, baseAsset, quoteAsset } = req.body;
            if (!symbol || !baseAsset || !quoteAsset) {
                return response_1.ResponseUtil.error(res, 'Missing required fields');
            }
            // 检查是否已经存在
            const existing = await database_1.prisma.favoriteSymbol.findUnique({
                where: {
                    userId_symbol: {
                        userId: user.id,
                        symbol
                    }
                }
            });
            if (existing) {
                return response_1.ResponseUtil.error(res, 'Symbol already in favorites');
            }
            const favorite = await database_1.prisma.favoriteSymbol.create({
                data: {
                    userId: user.id,
                    symbol,
                    baseAsset,
                    quoteAsset
                }
            });
            response_1.ResponseUtil.success(res, favorite, 'Symbol added to favorites');
        }
        catch (error) {
            logger_1.Logger.error('Failed to add favorite symbol', { error });
            response_1.ResponseUtil.error(res, 'Failed to add favorite symbol');
        }
    }
    /**
     * 移除关注币种
     */
    static async removeFavoriteSymbol(req, res) {
        try {
            const { user } = req;
            if (!user) {
                return response_1.ResponseUtil.unauthorized(res, 'User not authenticated');
            }
            const { symbol } = req.params;
            await database_1.prisma.favoriteSymbol.deleteMany({
                where: {
                    userId: user.id,
                    symbol
                }
            });
            response_1.ResponseUtil.success(res, { symbol }, 'Symbol removed from favorites');
        }
        catch (error) {
            logger_1.Logger.error('Failed to remove favorite symbol', { error });
            response_1.ResponseUtil.error(res, 'Failed to remove favorite symbol');
        }
    }
    /**
     * 搜索交易所币种（从本地数据库）
     */
    static async searchExchangeSymbols(req, res) {
        try {
            const { q = '', limit = 50, exchanges } = req.query;
            let exchangeList;
            if (exchanges) {
                exchangeList = Array.isArray(exchanges) ? exchanges : [exchanges];
            }
            const symbols = await exchange_symbols_service_1.ExchangeSymbolsService.searchSymbols(q, Number(limit), exchangeList);
            response_1.ResponseUtil.success(res, symbols, 'Exchange symbols retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to search exchange symbols', { error });
            response_1.ResponseUtil.error(res, 'Failed to search exchange symbols');
        }
    }
    /**
     * 获取所有可用的交易所币种
     */
    static async getAllExchangeSymbols(req, res) {
        try {
            const { limit = 1000, exchanges } = req.query;
            let exchangeList;
            if (exchanges) {
                exchangeList = Array.isArray(exchanges) ? exchanges : [exchanges];
            }
            const symbols = await exchange_symbols_service_1.ExchangeSymbolsService.getAllAvailableSymbols(Number(limit), exchangeList);
            response_1.ResponseUtil.success(res, symbols, 'Available symbols retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get available symbols', { error });
            response_1.ResponseUtil.error(res, 'Failed to get available symbols');
        }
    }
    /**
     * 手动更新交易所币种信息
     */
    static async updateExchangeSymbols(req, res) {
        try {
            logger_1.Logger.info('Manual exchange symbols update initiated');
            await exchange_symbols_service_1.ExchangeSymbolsService.updateSymbolsTask();
            response_1.ResponseUtil.success(res, {
                message: 'Exchange symbols update completed',
                timestamp: new Date().toISOString()
            }, 'Exchange symbols updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to update exchange symbols', { error });
            response_1.ResponseUtil.error(res, 'Failed to update exchange symbols');
        }
    }
    /**
     * 获取交易所币种统计信息
     */
    static async getExchangeSymbolsStats(req, res) {
        try {
            const stats = await database_1.prisma.exchangeSymbol.groupBy({
                by: ['exchange'],
                _count: {
                    symbol: true
                },
                where: {
                    status: 'TRADING'
                }
            });
            const totalCount = await database_1.prisma.exchangeSymbol.count({
                where: { status: 'TRADING' }
            });
            const lastUpdated = await database_1.prisma.exchangeSymbol.findFirst({
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
            response_1.ResponseUtil.success(res, result, 'Exchange symbols statistics retrieved successfully');
        }
        catch (error) {
            logger_1.Logger.error('Failed to get exchange symbols stats', { error });
            response_1.ResponseUtil.error(res, 'Failed to get exchange symbols statistics');
        }
    }
}
exports.SpotController = SpotController;
//# sourceMappingURL=spot.controller.js.map