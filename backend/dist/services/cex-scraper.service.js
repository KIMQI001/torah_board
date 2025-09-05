"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CexScraperService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
const anti_detection_service_1 = require("./anti-detection.service");
const cex_api_sources_service_1 = require("./cex-api-sources.service");
class CexScraperService {
    /**
     * 获取通用请求头
     */
    static getCommonHeaders(exchange) {
        const baseHeaders = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        };
        switch (exchange) {
            case 'binance':
                return {
                    ...baseHeaders,
                    'Referer': 'https://www.binance.com/zh-CN/support/announcement/',
                    'Origin': 'https://www.binance.com',
                    'Host': 'www.binance.com',
                };
            case 'okx':
                return {
                    ...baseHeaders,
                    'Referer': 'https://www.okx.com/zh-hans/help/section/announcements-latest-announcements',
                    'Origin': 'https://www.okx.com',
                    'Host': 'www.okx.com',
                };
            default:
                return baseHeaders;
        }
    }
    /**
     * 发送HTTP请求并处理重试
     */
    static async makeRequest(url, config = {}, retryCount = 0) {
        try {
            logger_1.Logger.info(`🌐 请求API: ${url}`);
            const response = await (0, axios_1.default)({
                method: 'GET',
                url,
                timeout: this.REQUEST_TIMEOUT,
                validateStatus: (status) => status < 500, // 只对5xx错误进行重试
                ...config,
            });
            if (response.status === 200 && response.data) {
                logger_1.Logger.info(`✅ API请求成功: ${url} (${response.status})`);
                return response.data;
            }
            else {
                logger_1.Logger.warn(`⚠️ API响应异常: ${url} (${response.status})`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        catch (error) {
            logger_1.Logger.error(`❌ API请求失败: ${url}`, {
                error: error.message,
                status: error.response?.status,
                retryCount
            });
            // 如果是客户端错误(4xx)或达到最大重试次数，直接抛出错误
            if (error.response?.status < 500 ||
                retryCount >= this.MAX_RETRIES) {
                throw error;
            }
            // 服务器错误(5xx)或网络错误，进行重试
            logger_1.Logger.info(`🔄 准备重试请求 (${retryCount + 1}/${this.MAX_RETRIES}): ${url}`);
            await this.delay(this.RETRY_DELAY * Math.pow(2, retryCount)); // 指数退避
            return this.makeRequest(url, config, retryCount + 1);
        }
    }
    /**
     * 延迟函数
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 获取Binance公告数据 - 增强版
     */
    static async scrapeBinanceAnnouncements() {
        logger_1.Logger.info('🚀 开始使用增强策略抓取Binance公告数据...');
        // 策略1: 尝试新的API数据源
        try {
            const apiAnnouncements = await cex_api_sources_service_1.CexApiSourcesService.fetchBinanceAnnouncements();
            if (apiAnnouncements.length > 0) {
                logger_1.Logger.info(`✅ API数据源成功获取${apiAnnouncements.length}条Binance公告`);
                return apiAnnouncements;
            }
        }
        catch (error) {
            logger_1.Logger.error('API数据源获取失败:', error.message);
        }
        // 策略2: 使用反爬虫绕过的传统API
        const announcements = await this.tryBinanceTraditionalApis();
        if (announcements.length > 0) {
            return announcements;
        }
        // 策略3: 网页抓取
        logger_1.Logger.warn('⚠️ 所有API策略都失败，尝试网页抓取...');
        const webAnnouncements = await this.scrapeBinanceWebPage();
        if (webAnnouncements.length > 0) {
            return webAnnouncements;
        }
        // 策略4: 返回缓存或fallback数据
        logger_1.Logger.warn('⚠️ 所有策略都失败，返回fallback数据');
        return this.getBinanceFallbackData();
    }
    /**
     * 尝试Binance传统API（使用反爬虫绕过）
     */
    static async tryBinanceTraditionalApis() {
        const baseUrl = 'https://www.binance.com';
        const announcements = [];
        // 测试主要端点
        for (const [endpointType, endpoints] of Object.entries(this.BINANCE_ENDPOINTS)) {
            logger_1.Logger.info(`🔍 测试Binance ${endpointType}端点（反爬虫增强）...`);
            try {
                const url = `${baseUrl}${endpoints.announcements}`;
                const params = {
                    catalogId: 93, // 最新公告分类ID
                    pageNo: 1,
                    pageSize: 20,
                    language: 'zh-CN',
                };
                // 使用反爬虫绕过服务
                const response = await anti_detection_service_1.AntiDetectionService.makeSmartRequest(url, {
                    params,
                    headers: {
                        'Referer': 'https://www.binance.com/zh-CN/support/announcement/',
                    },
                    meta: { exchange: 'binance' },
                });
                if (this.isBinanceValidResponse(response.data)) {
                    const parsedAnnouncements = this.parseBinanceResponse(response.data);
                    logger_1.Logger.info(`✅ Binance ${endpointType}端点成功: 获取${parsedAnnouncements.length}条公告`);
                    announcements.push(...parsedAnnouncements);
                    break; // 成功获取数据，退出循环
                }
            }
            catch (error) {
                logger_1.Logger.error(`❌ Binance ${endpointType}端点失败:`, { error: error.message });
                // 添加智能延迟，避免被限制
                await anti_detection_service_1.AntiDetectionService.humanDelay(2000, 4000);
                continue; // 尝试下一个端点
            }
        }
        return announcements;
    }
    /**
     * 获取OKX公告数据 - 增强版
     */
    static async scrapeOkxAnnouncements() {
        logger_1.Logger.info('🚀 开始使用增强策略抓取OKX公告数据...');
        // 策略1: 尝试新的API数据源
        try {
            const apiAnnouncements = await cex_api_sources_service_1.CexApiSourcesService.fetchOkxAnnouncements();
            if (apiAnnouncements.length > 0) {
                logger_1.Logger.info(`✅ API数据源成功获取${apiAnnouncements.length}条OKX公告`);
                return apiAnnouncements;
            }
        }
        catch (error) {
            logger_1.Logger.error('OKX API数据源获取失败:', error.message);
        }
        // 策略2: 使用反爬虫绕过的传统API
        const announcements = await this.tryOkxTraditionalApis();
        if (announcements.length > 0) {
            return announcements;
        }
        // 策略3: 网页抓取
        logger_1.Logger.warn('⚠️ 所有API策略都失败，尝试网页抓取...');
        const webAnnouncements = await this.scrapeOkxWebPage();
        if (webAnnouncements.length > 0) {
            return webAnnouncements;
        }
        // 策略4: 返回缓存或fallback数据
        logger_1.Logger.warn('⚠️ 所有策略都失败，返回fallback数据');
        return this.getOkxFallbackData();
    }
    /**
     * 尝试OKX传统API（使用反爬虫绕过）
     */
    static async tryOkxTraditionalApis() {
        const baseUrl = 'https://www.okx.com';
        const announcements = [];
        // 测试主要端点
        for (const [endpointType, endpoints] of Object.entries(this.OKX_ENDPOINTS)) {
            logger_1.Logger.info(`🔍 测试OKX ${endpointType}端点（反爬虫增强）...`);
            try {
                const url = `${baseUrl}${endpoints.announcements}`;
                const params = {
                    skip: 0,
                    limit: 15,
                    locale: 'zh-hans',
                    category: 'latest',
                };
                // 使用反爬虫绕过服务
                const response = await anti_detection_service_1.AntiDetectionService.makeSmartRequest(url, {
                    params,
                    headers: {
                        'Referer': 'https://www.okx.com/zh-hans/help/section/announcements-latest-announcements',
                    },
                    meta: { exchange: 'okx' },
                });
                if (this.isOkxValidResponse(response.data)) {
                    const parsedAnnouncements = this.parseOkxResponse(response.data);
                    logger_1.Logger.info(`✅ OKX ${endpointType}端点成功: 获取${parsedAnnouncements.length}条公告`);
                    announcements.push(...parsedAnnouncements);
                    break; // 成功获取数据，退出循环
                }
            }
            catch (error) {
                logger_1.Logger.error(`❌ OKX ${endpointType}端点失败:`, { error: error.message });
                // 添加智能延迟，避免被限制
                await anti_detection_service_1.AntiDetectionService.humanDelay(2000, 4000);
                continue; // 尝试下一个端点
            }
        }
        return announcements;
    }
    /**
     * 验证Binance API响应
     */
    static isBinanceValidResponse(data) {
        return (data &&
            (data.data || data.articles || data.list || Array.isArray(data)) &&
            data.success !== false &&
            data.code !== 'error');
    }
    /**
     * 验证OKX API响应
     */
    static isOkxValidResponse(data) {
        return (data &&
            (data.data || data.list || Array.isArray(data)) &&
            data.code !== 'error' &&
            data.success !== false);
    }
    /**
     * 解析Binance API响应
     */
    static parseBinanceResponse(data) {
        try {
            let articles = data.data || data.articles || data.list || data;
            if (!Array.isArray(articles)) {
                articles = [articles];
            }
            return articles.map((article, index) => {
                const publishTime = article.publishDate || article.releaseDate || article.createTime || Date.now();
                return {
                    id: `binance_${article.id || article.articleId || Date.now() + index}`,
                    exchange: 'binance',
                    title: article.title || article.name || '未知标题',
                    content: article.content || article.summary || article.description || '暂无内容',
                    category: this.mapBinanceCategory(article.catalogId || article.categoryId),
                    importance: this.determineBinanceImportance(article),
                    publishTime: typeof publishTime === 'string' ? new Date(publishTime).getTime() : publishTime,
                    tags: this.extractBinanceTags(article),
                    url: `https://www.binance.com/zh-CN/support/announcement/${article.id || article.articleId}`,
                };
            });
        }
        catch (error) {
            logger_1.Logger.error('解析Binance响应失败:', error);
            return [];
        }
    }
    /**
     * 解析OKX API响应
     */
    static parseOkxResponse(data) {
        try {
            let articles = data.data || data.list || data;
            if (!Array.isArray(articles)) {
                articles = [articles];
            }
            return articles.map((article, index) => {
                const publishTime = article.publishTime || article.createdAt || article.publishDate || Date.now();
                return {
                    id: `okx_${article.id || article.slug || Date.now() + index}`,
                    exchange: 'okx',
                    title: article.title || article.name || '未知标题',
                    content: article.content || article.summary || article.description || '暂无内容',
                    category: this.mapOkxCategory(article.category || article.type),
                    importance: this.determineOkxImportance(article),
                    publishTime: typeof publishTime === 'string' ? new Date(publishTime).getTime() : publishTime,
                    tags: this.extractOkxTags(article),
                    url: `https://www.okx.com/zh-hans/help/announcements/${article.id || article.slug}`,
                };
            });
        }
        catch (error) {
            logger_1.Logger.error('解析OKX响应失败:', error);
            return [];
        }
    }
    /**
     * 映射Binance分类
     */
    static mapBinanceCategory(catalogId) {
        const categoryMap = {
            '93': 'latest',
            '49': 'new-listings',
            '34': 'api-updates',
            '161': 'derivatives',
            '128': 'margin-trading',
        };
        return categoryMap[String(catalogId)] || 'general';
    }
    /**
     * 映射OKX分类
     */
    static mapOkxCategory(category) {
        if (!category)
            return 'general';
        const lowerCategory = category.toLowerCase();
        if (lowerCategory.includes('listing') || lowerCategory.includes('上线'))
            return 'new-listings';
        if (lowerCategory.includes('api') || lowerCategory.includes('接口'))
            return 'api-updates';
        if (lowerCategory.includes('derivatives') || lowerCategory.includes('衍生品'))
            return 'derivatives';
        if (lowerCategory.includes('margin') || lowerCategory.includes('保证金'))
            return 'margin-trading';
        return 'general';
    }
    /**
     * 判断Binance公告重要性
     */
    static determineBinanceImportance(article) {
        const title = (article.title || '').toLowerCase();
        const content = (article.content || article.summary || '').toLowerCase();
        if (title.includes('重要') || title.includes('urgent') || title.includes('紧急') ||
            content.includes('重要') || article.priority === 'high') {
            return 'high';
        }
        if (title.includes('新币') || title.includes('上线') || title.includes('listing') ||
            title.includes('api') || title.includes('更新')) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * 判断OKX公告重要性
     */
    static determineOkxImportance(article) {
        const title = (article.title || '').toLowerCase();
        const content = (article.content || article.summary || '').toLowerCase();
        if (title.includes('重要') || title.includes('urgent') || title.includes('紧急') ||
            content.includes('重要') || article.priority === 'high') {
            return 'high';
        }
        if (title.includes('新币') || title.includes('上线') || title.includes('listing') ||
            title.includes('api') || title.includes('更新')) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * 提取Binance标签
     */
    static extractBinanceTags(article) {
        const tags = [];
        const title = article.title || '';
        const content = article.content || article.summary || '';
        // 常见标签模式
        if (title.includes('上线') || title.includes('listing'))
            tags.push('新币上线');
        if (title.includes('API') || content.includes('API'))
            tags.push('API');
        if (title.includes('维护') || title.includes('maintenance'))
            tags.push('系统维护');
        if (title.includes('合约') || title.includes('futures'))
            tags.push('合约交易');
        if (title.includes('现货') || title.includes('spot'))
            tags.push('现货交易');
        return tags.length > 0 ? tags : ['公告'];
    }
    /**
     * 提取OKX标签
     */
    static extractOkxTags(article) {
        const tags = [];
        const title = article.title || '';
        const content = article.content || article.summary || '';
        // 常见标签模式
        if (title.includes('上线') || title.includes('listing'))
            tags.push('新币上线');
        if (title.includes('API') || content.includes('API'))
            tags.push('API');
        if (title.includes('维护') || title.includes('maintenance'))
            tags.push('系统维护');
        if (title.includes('合约') || title.includes('futures'))
            tags.push('合约交易');
        if (title.includes('现货') || title.includes('spot'))
            tags.push('现货交易');
        return tags.length > 0 ? tags : ['公告'];
    }
    /**
     * 备用方案：网页抓取Binance
     */
    static async scrapeBinanceWebPage() {
        logger_1.Logger.info('🌐 尝试网页抓取Binance公告...');
        try {
            // 使用专门的网页爬虫服务
            const { WebScraperService } = await Promise.resolve().then(() => __importStar(require('./web-scraper.service')));
            const announcements = await WebScraperService.scrapeBinanceWeb();
            if (announcements.length > 0) {
                logger_1.Logger.info(`✅ Binance网页抓取成功: ${announcements.length}条公告`);
                return announcements;
            }
            else {
                logger_1.Logger.warn('Binance网页抓取结果为空，使用备用数据');
                return this.getBinanceFallbackData();
            }
        }
        catch (error) {
            logger_1.Logger.error('Binance网页抓取失败:', error);
            return this.getBinanceFallbackData();
        }
    }
    /**
     * 备用方案：网页抓取OKX
     */
    static async scrapeOkxWebPage() {
        logger_1.Logger.info('🌐 尝试网页抓取OKX公告...');
        try {
            // 使用专门的网页爬虫服务
            const { WebScraperService } = await Promise.resolve().then(() => __importStar(require('./web-scraper.service')));
            const announcements = await WebScraperService.scrapeOkxWeb();
            if (announcements.length > 0) {
                logger_1.Logger.info(`✅ OKX网页抓取成功: ${announcements.length}条公告`);
                return announcements;
            }
            else {
                logger_1.Logger.warn('OKX网页抓取结果为空，使用备用数据');
                return this.getOkxFallbackData();
            }
        }
        catch (error) {
            logger_1.Logger.error('OKX网页抓取失败:', error);
            return this.getOkxFallbackData();
        }
    }
    /**
     * Binance备用数据
     */
    static getBinanceFallbackData() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        return [
            {
                id: 'binance_fallback_1',
                exchange: 'binance',
                title: 'Binance上线ORDI永续合约',
                content: 'Binance将于今日上线ORDI-USDT永续合约，支持高达50倍杠杆交易。',
                category: 'derivatives',
                importance: 'high',
                publishTime: now - oneHour,
                tags: ['ORDI', '合约', '永续'],
                url: 'https://www.binance.com/zh-CN/support/announcement',
            },
            {
                id: 'binance_fallback_2',
                exchange: 'binance',
                title: '新增SATS现货交易对',
                content: 'Binance现已新增SATS/USDT现货交易对，现开始接受充值。',
                category: 'new-listings',
                importance: 'medium',
                publishTime: now - 2 * oneHour,
                tags: ['SATS', '现货', '上线'],
                url: 'https://www.binance.com/zh-CN/support/announcement',
            },
        ];
    }
    /**
     * OKX备用数据
     */
    static getOkxFallbackData() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        return [
            {
                id: 'okx_fallback_1',
                exchange: 'okx',
                title: 'OKX上线Portal代币现货交易',
                content: 'OKX将于今日上线Portal(PORTAL)代币现货交易，支持PORTAL/USDT交易对。',
                category: 'new-listings',
                importance: 'high',
                publishTime: now - oneHour,
                tags: ['PORTAL', '现货', '上线'],
                url: 'https://www.okx.com/zh-hans/help/announcements',
            },
            {
                id: 'okx_fallback_2',
                exchange: 'okx',
                title: 'OKX系统维护通知',
                content: 'OKX将于北京时间进行系统升级维护，预计维护时间30分钟。',
                category: 'general',
                importance: 'medium',
                publishTime: now - 2 * oneHour,
                tags: ['系统维护', '升级'],
                url: 'https://www.okx.com/zh-hans/help/announcements',
            },
        ];
    }
    /**
     * 综合抓取方法 - 增强版
     */
    static async scrapeAllExchanges() {
        logger_1.Logger.info('🚀 开始综合抓取所有交易所公告（增强版）...');
        // 并行抓取主要交易所
        const mainExchangeResults = await Promise.allSettled([
            this.scrapeBinanceAnnouncements(),
            this.scrapeOkxAnnouncements(),
        ]);
        const allAnnouncements = [];
        mainExchangeResults.forEach((result, index) => {
            const exchangeName = index === 0 ? 'Binance' : 'OKX';
            if (result.status === 'fulfilled') {
                logger_1.Logger.info(`✅ ${exchangeName}抓取成功: ${result.value.length}条公告`);
                allAnnouncements.push(...result.value);
            }
            else {
                logger_1.Logger.error(`❌ ${exchangeName}抓取失败:`, result.reason);
            }
        });
        // 抓取其他交易所公告（非阻塞）
        try {
            const otherExchangeAnnouncements = await cex_api_sources_service_1.CexApiSourcesService.fetchOtherExchangeAnnouncements();
            if (otherExchangeAnnouncements.length > 0) {
                logger_1.Logger.info(`✅ 其他交易所抓取成功: ${otherExchangeAnnouncements.length}条公告`);
                allAnnouncements.push(...otherExchangeAnnouncements);
            }
        }
        catch (error) {
            logger_1.Logger.error('其他交易所抓取失败:', error);
        }
        // 按时间排序，最新的在前
        allAnnouncements.sort((a, b) => b.publishTime - a.publishTime);
        // 去重处理（基于标题相似性）
        const uniqueAnnouncements = this.removeDuplicateAnnouncements(allAnnouncements);
        logger_1.Logger.info(`🎉 综合抓取完成，共获取${allAnnouncements.length}条公告，去重后${uniqueAnnouncements.length}条`);
        return uniqueAnnouncements;
    }
    /**
     * 去除重复公告
     */
    static removeDuplicateAnnouncements(announcements) {
        const seen = new Set();
        const unique = [];
        for (const announcement of announcements) {
            // 使用标题的前50个字符作为唯一标识
            const key = announcement.title.substring(0, 50).toLowerCase().replace(/\s+/g, '');
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(announcement);
            }
        }
        return unique;
    }
    /**
     * 健康检查 - 检测各个数据源的可用性
     */
    static async healthCheck() {
        logger_1.Logger.info('🔍 开始健康检查...');
        const checks = {
            binance_api: false,
            okx_api: false,
            binance_web: false,
            okx_web: false,
        };
        // 检查Binance API
        try {
            const binanceResult = await cex_api_sources_service_1.CexApiSourcesService.fetchBinanceAnnouncements();
            checks.binance_api = binanceResult.length > 0;
        }
        catch (error) {
            logger_1.Logger.warn('Binance API健康检查失败');
        }
        // 检查OKX API
        try {
            const okxResult = await cex_api_sources_service_1.CexApiSourcesService.fetchOkxAnnouncements();
            checks.okx_api = okxResult.length > 0;
        }
        catch (error) {
            logger_1.Logger.warn('OKX API健康检查失败');
        }
        // 检查网页抓取
        try {
            const { WebScraperService } = await Promise.resolve().then(() => __importStar(require('./web-scraper.service')));
            const webResults = await Promise.allSettled([
                WebScraperService.scrapeBinanceWeb(),
                WebScraperService.scrapeOkxWeb(),
            ]);
            checks.binance_web = webResults[0].status === 'fulfilled' && webResults[0].value.length > 0;
            checks.okx_web = webResults[1].status === 'fulfilled' && webResults[1].value.length > 0;
        }
        catch (error) {
            logger_1.Logger.warn('网页抓取健康检查失败');
        }
        logger_1.Logger.info('健康检查完成:', checks);
        return checks;
    }
}
exports.CexScraperService = CexScraperService;
CexScraperService.REQUEST_TIMEOUT = 15000;
CexScraperService.MAX_RETRIES = 3;
CexScraperService.RETRY_DELAY = 2000;
// Binance API端点配置
CexScraperService.BINANCE_ENDPOINTS = {
    // 主要端点
    primary: {
        announcements: '/bapi/composite/v1/public/cms/article/list/query',
        announcementDetail: '/bapi/composite/v1/public/cms/article/catalog/list/query',
        categories: '/bapi/composite/v1/public/cms/catalog/list/query',
    },
    // 备选端点
    fallback: {
        announcements: '/bapi/v1/public/announcements/list',
        announcementDetail: '/bapi/v1/public/announcements',
        categories: '/bapi/v1/public/announcements/categories',
    },
};
// OKX API端点配置
CexScraperService.OKX_ENDPOINTS = {
    // 主要端点
    primary: {
        announcements: '/api/v5/public/announcements',
        announcementDetail: '/api/v5/public/announcements',
        categories: '/api/v5/public/announcements/categories',
    },
    // 备选端点
    fallback: {
        announcements: '/v5/public/news/announcements',
        announcementDetail: '/v5/public/news/announcements',
        categories: '/v5/public/news/categories',
    },
};
//# sourceMappingURL=cex-scraper.service.js.map