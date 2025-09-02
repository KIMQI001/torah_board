import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
export declare class SpotController {
    /**
     * 获取市场数据
     */
    static getMarketData(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取特定交易对数据
     */
    static getSymbolData(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取价格对比
     */
    static getPriceComparison(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取订单簿
     */
    static getOrderBook(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取价格预警
     */
    static getPriceAlerts(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 创建价格预警
     */
    static createPriceAlert(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 更新价格预警
     */
    static updatePriceAlert(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 删除价格预警
     */
    static deletePriceAlert(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取CEX公告
     */
    static getAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取高优先级公告
     */
    static getHighPriorityAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取特定币种公告
     */
    static getTokenAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取价格异常
     */
    static getPriceAnomalies(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取市场概览
     */
    static getMarketOverview(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取热门币种
     */
    static getTrendingTokens(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取涨幅榜
     */
    static getTopGainers(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取跌幅榜
     */
    static getTopLosers(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 启动实时价格监控
     */
    static startRealTimeTracking(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 停止实时价格监控
     */
    static stopRealTimeTracking(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取实时价格流 - Server-Sent Events
     */
    static getRealTimePriceStream(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取聚合价格数据
     */
    static getAggregatedPrices(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取实时监控状态
     */
    static getRealTimeStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 添加监控交易对
     */
    static addSymbolsToTracking(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 移除监控交易对
     */
    static removeSymbolsFromTracking(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 重新连接WebSocket
     */
    static reconnectWebSocket(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取用户关注的币种
     */
    static getFavoriteSymbols(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 添加关注币种
     */
    static addFavoriteSymbol(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 移除关注币种
     */
    static removeFavoriteSymbol(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 搜索交易所币种（从本地数据库）
     */
    static searchExchangeSymbols(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取所有可用的交易所币种
     */
    static getAllExchangeSymbols(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 手动更新交易所币种信息
     */
    static updateExchangeSymbols(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取交易所币种统计信息
     */
    static getExchangeSymbolsStats(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=spot.controller.d.ts.map