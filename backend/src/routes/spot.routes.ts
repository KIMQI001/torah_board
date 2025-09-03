import { Router } from 'express';
import { SpotController } from '@/controllers/spot.controller';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

// CEX公告路由 - 无需认证
router.get('/announcements', SpotController.getAnnouncements);
router.get('/announcements/high-priority', SpotController.getHighPriorityAnnouncements);
router.get('/announcements/token/:symbol', SpotController.getTokenAnnouncements);

// 应用认证中间件到其他现货交易路由
router.use(authMiddleware);

// 市场数据路由
router.get('/markets', SpotController.getMarketData);
router.get('/markets/:symbol', SpotController.getSymbolData);
router.get('/markets/:symbol/comparison', SpotController.getPriceComparison);
router.get('/markets/:symbol/orderbook', SpotController.getOrderBook);

// 价格预警路由
router.get('/alerts', SpotController.getPriceAlerts);
router.post('/alerts', SpotController.createPriceAlert);
router.put('/alerts/:id', SpotController.updatePriceAlert);
router.delete('/alerts/:id', SpotController.deletePriceAlert);

// 异常检测路由
router.get('/anomalies', SpotController.getPriceAnomalies);

// 统计数据路由
router.get('/stats/overview', SpotController.getMarketOverview);
router.get('/stats/trending', SpotController.getTrendingTokens);
router.get('/stats/gainers', SpotController.getTopGainers);
router.get('/stats/losers', SpotController.getTopLosers);

// 实时数据路由
router.post('/realtime/start', SpotController.startRealTimeTracking);
router.post('/realtime/stop', SpotController.stopRealTimeTracking);
router.get('/realtime/stream', SpotController.getRealTimePriceStream);
router.get('/realtime/prices', SpotController.getAggregatedPrices);
router.get('/realtime/status', SpotController.getRealTimeStatus);
router.post('/realtime/symbols/add', SpotController.addSymbolsToTracking);
router.post('/realtime/symbols/remove', SpotController.removeSymbolsFromTracking);
router.post('/realtime/reconnect', SpotController.reconnectWebSocket);

// 关注币种路由
router.get('/favorites', SpotController.getFavoriteSymbols);
router.post('/favorites', SpotController.addFavoriteSymbol);
router.delete('/favorites/:symbol', SpotController.removeFavoriteSymbol);

// 交易所币种数据库路由
router.get('/symbols/search', SpotController.searchExchangeSymbols);
router.get('/symbols/all', SpotController.getAllExchangeSymbols);
router.post('/symbols/update', SpotController.updateExchangeSymbols);
router.get('/symbols/stats', SpotController.getExchangeSymbolsStats);

// 快讯路由
router.get('/feeds', SpotController.getNewsFeeds);
router.get('/feeds/hot', SpotController.getHotNewsFeeds);
router.get('/feeds/onchain', SpotController.getOnChainFeeds);
router.get('/feeds/whale', SpotController.getWhaleActivity);
router.get('/feeds/symbol/:symbol', SpotController.getSymbolNewsFeeds);
router.post('/feeds/update', SpotController.triggerFeedsUpdate);
router.get('/feeds/stats', SpotController.getFeedsStats);

export { router as spotRoutes };