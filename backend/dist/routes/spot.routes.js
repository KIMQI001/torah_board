"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spotRoutes = void 0;
const express_1 = require("express");
const spot_controller_1 = require("@/controllers/spot.controller");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
exports.spotRoutes = router;
// CEX公告路由 - 无需认证
router.get('/announcements', spot_controller_1.SpotController.getAnnouncements);
router.get('/announcements/high-priority', spot_controller_1.SpotController.getHighPriorityAnnouncements);
router.get('/announcements/token/:symbol', spot_controller_1.SpotController.getTokenAnnouncements);
// 应用认证中间件到其他现货交易路由
router.use(auth_1.authMiddleware);
// 市场数据路由
router.get('/markets', spot_controller_1.SpotController.getMarketData);
router.get('/markets/:symbol', spot_controller_1.SpotController.getSymbolData);
router.get('/markets/:symbol/comparison', spot_controller_1.SpotController.getPriceComparison);
router.get('/markets/:symbol/orderbook', spot_controller_1.SpotController.getOrderBook);
// 价格预警路由
router.get('/alerts', spot_controller_1.SpotController.getPriceAlerts);
router.post('/alerts', spot_controller_1.SpotController.createPriceAlert);
router.put('/alerts/:id', spot_controller_1.SpotController.updatePriceAlert);
router.delete('/alerts/:id', spot_controller_1.SpotController.deletePriceAlert);
// 异常检测路由
router.get('/anomalies', spot_controller_1.SpotController.getPriceAnomalies);
// 统计数据路由
router.get('/stats/overview', spot_controller_1.SpotController.getMarketOverview);
router.get('/stats/trending', spot_controller_1.SpotController.getTrendingTokens);
router.get('/stats/gainers', spot_controller_1.SpotController.getTopGainers);
router.get('/stats/losers', spot_controller_1.SpotController.getTopLosers);
// 实时数据路由
router.post('/realtime/start', spot_controller_1.SpotController.startRealTimeTracking);
router.post('/realtime/stop', spot_controller_1.SpotController.stopRealTimeTracking);
router.get('/realtime/stream', spot_controller_1.SpotController.getRealTimePriceStream);
router.get('/realtime/prices', spot_controller_1.SpotController.getAggregatedPrices);
router.get('/realtime/status', spot_controller_1.SpotController.getRealTimeStatus);
router.post('/realtime/symbols/add', spot_controller_1.SpotController.addSymbolsToTracking);
router.post('/realtime/symbols/remove', spot_controller_1.SpotController.removeSymbolsFromTracking);
router.post('/realtime/reconnect', spot_controller_1.SpotController.reconnectWebSocket);
// 关注币种路由
router.get('/favorites', spot_controller_1.SpotController.getFavoriteSymbols);
router.post('/favorites', spot_controller_1.SpotController.addFavoriteSymbol);
router.delete('/favorites/:symbol', spot_controller_1.SpotController.removeFavoriteSymbol);
// 交易所币种数据库路由
router.get('/symbols/search', spot_controller_1.SpotController.searchExchangeSymbols);
router.get('/symbols/all', spot_controller_1.SpotController.getAllExchangeSymbols);
router.post('/symbols/update', spot_controller_1.SpotController.updateExchangeSymbols);
router.get('/symbols/stats', spot_controller_1.SpotController.getExchangeSymbolsStats);
// 快讯路由
router.get('/feeds', spot_controller_1.SpotController.getNewsFeeds);
router.get('/feeds/hot', spot_controller_1.SpotController.getHotNewsFeeds);
router.get('/feeds/onchain', spot_controller_1.SpotController.getOnChainFeeds);
router.get('/feeds/whale', spot_controller_1.SpotController.getWhaleActivity);
router.get('/feeds/symbol/:symbol', spot_controller_1.SpotController.getSymbolNewsFeeds);
router.post('/feeds/update', spot_controller_1.SpotController.triggerFeedsUpdate);
router.get('/feeds/stats', spot_controller_1.SpotController.getFeedsStats);
//# sourceMappingURL=spot.routes.js.map