"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeSymbolsService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
const database_1 = require("./database");
class ExchangeSymbolsService {
    /**
     * 获取Binance交易所币种信息
     */
    static async fetchBinanceSymbols() {
        try {
            logger_1.Logger.info('开始获取Binance币种信息');
            const response = await axios_1.default.get(`${this.BINANCE_BASE_URL}/exchangeInfo`, {
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
                }
            });
            const symbols = response.data.symbols || [];
            logger_1.Logger.info(`获取到 ${symbols.length} 个Binance交易对`);
            return symbols
                .filter((symbol) => symbol.status === 'TRADING')
                .map((symbol) => ({
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
        }
        catch (error) {
            logger_1.Logger.error('获取Binance币种信息失败', { error });
            throw new Error('Failed to fetch Binance symbols');
        }
    }
    /**
     * 获取OKX交易所币种信息
     */
    static async fetchOKXSymbols() {
        try {
            logger_1.Logger.info('开始获取OKX币种信息');
            const response = await axios_1.default.get(`${this.OKX_BASE_URL}/public/instruments`, {
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
            logger_1.Logger.info(`获取到 ${symbols.length} 个OKX交易对`);
            return symbols
                .filter((symbol) => symbol.state === 'live')
                .map((symbol) => {
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
        }
        catch (error) {
            logger_1.Logger.error('获取OKX币种信息失败', { error });
            throw new Error('Failed to fetch OKX symbols');
        }
    }
    /**
     * 获取Gate.io交易所币种信息
     */
    static async fetchGateSymbols() {
        try {
            logger_1.Logger.info('开始获取Gate.io币种信息');
            const response = await axios_1.default.get(`${this.GATE_BASE_URL}/spot/currency_pairs`, {
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Web3Dashboard/1.0)'
                }
            });
            const symbols = response.data || [];
            logger_1.Logger.info(`获取到 ${symbols.length} 个Gate.io交易对`);
            return symbols
                .filter((symbol) => symbol.trade_status === 'tradable')
                .map((symbol) => {
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
        }
        catch (error) {
            logger_1.Logger.error('获取Gate.io币种信息失败', { error });
            throw new Error('Failed to fetch Gate symbols');
        }
    }
    /**
     * 获取所有交易所的币种信息
     */
    static async fetchAllExchangeSymbols() {
        try {
            logger_1.Logger.info('开始获取所有交易所币种信息');
            const results = await Promise.allSettled([
                this.fetchBinanceSymbols(),
                this.fetchOKXSymbols(),
                this.fetchGateSymbols()
            ]);
            const allSymbols = [];
            results.forEach((result, index) => {
                const exchanges = ['Binance', 'OKX', 'Gate.io'];
                if (result.status === 'fulfilled') {
                    allSymbols.push(...result.value);
                    logger_1.Logger.info(`成功获取${exchanges[index]}币种信息: ${result.value.length}个`);
                }
                else {
                    logger_1.Logger.error(`获取${exchanges[index]}币种信息失败`, { error: result.reason });
                }
            });
            logger_1.Logger.info(`总共获取到 ${allSymbols.length} 个交易对`);
            return allSymbols;
        }
        catch (error) {
            logger_1.Logger.error('获取交易所币种信息失败', { error });
            throw new Error('Failed to fetch exchange symbols');
        }
    }
    /**
     * 保存币种信息到数据库
     */
    static async saveSymbolsToDatabase(symbols) {
        try {
            logger_1.Logger.info(`开始保存 ${symbols.length} 个币种信息到数据库`);
            const batchSize = 100;
            let processed = 0;
            for (let i = 0; i < symbols.length; i += batchSize) {
                const batch = symbols.slice(i, i + batchSize);
                await Promise.all(batch.map(async (symbolInfo) => {
                    try {
                        await database_1.prisma.exchangeSymbol.upsert({
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
                    }
                    catch (error) {
                        logger_1.Logger.error(`保存币种信息失败: ${symbolInfo.symbol}@${symbolInfo.exchange}`, { error });
                    }
                }));
                processed += batch.length;
                logger_1.Logger.info(`已处理 ${processed}/${symbols.length} 个币种信息`);
            }
            logger_1.Logger.info(`币种信息保存完成，共处理 ${processed} 个交易对`);
        }
        catch (error) {
            logger_1.Logger.error('保存币种信息到数据库失败', { error });
            throw new Error('Failed to save symbols to database');
        }
    }
    /**
     * 从数据库搜索币种信息
     */
    static async searchSymbols(query, limit = 50, exchanges) {
        try {
            const whereClause = {
                AND: [
                    { status: 'TRADING' },
                    {
                        OR: [
                            { baseAsset: { contains: query.toUpperCase() } },
                            { symbol: { contains: query.toUpperCase() } }
                        ]
                    }
                ]
            };
            if (exchanges && exchanges.length > 0) {
                whereClause.AND.push({ exchange: { in: exchanges } });
            }
            const symbols = await database_1.prisma.exchangeSymbol.findMany({
                where: whereClause,
                orderBy: [
                    { baseAsset: 'asc' },
                    { exchange: 'asc' }
                ],
                take: limit,
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
        }
        catch (error) {
            logger_1.Logger.error('搜索币种信息失败', { error, query });
            throw new Error('Failed to search symbols');
        }
    }
    /**
     * 获取所有可用的币种列表（用于收藏功能）
     */
    static async getAllAvailableSymbols(limit = 1000, exchanges) {
        try {
            const whereClause = {
                status: 'TRADING',
                isSpotTradingAllowed: true
            };
            if (exchanges && exchanges.length > 0) {
                whereClause.exchange = { in: exchanges };
            }
            const symbols = await database_1.prisma.exchangeSymbol.findMany({
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
        }
        catch (error) {
            logger_1.Logger.error('获取可用币种列表失败', { error });
            throw new Error('Failed to get available symbols');
        }
    }
    /**
     * 定期更新币种信息任务
     */
    static async updateSymbolsTask() {
        try {
            logger_1.Logger.info('开始执行币种信息更新任务');
            const symbols = await this.fetchAllExchangeSymbols();
            if (symbols.length > 0) {
                await this.saveSymbolsToDatabase(symbols);
                logger_1.Logger.info('币种信息更新任务完成');
            }
            else {
                logger_1.Logger.warn('未获取到任何币种信息');
            }
        }
        catch (error) {
            logger_1.Logger.error('币种信息更新任务失败', { error });
            throw error;
        }
    }
}
exports.ExchangeSymbolsService = ExchangeSymbolsService;
ExchangeSymbolsService.BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
ExchangeSymbolsService.OKX_BASE_URL = 'https://www.okx.com/api/v5';
ExchangeSymbolsService.GATE_BASE_URL = 'https://api.gateio.ws/api/v4';
ExchangeSymbolsService.REQUEST_TIMEOUT = 10000;
ExchangeSymbolsService.MAX_RETRIES = 3;
ExchangeSymbolsService.RETRY_DELAY = 2000;
//# sourceMappingURL=exchange-symbols.service.js.map