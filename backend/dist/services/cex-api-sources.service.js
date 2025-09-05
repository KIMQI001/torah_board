"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CexApiSourcesService = void 0;
const logger_1 = require("@/utils/logger");
const anti_detection_service_1 = require("./anti-detection.service");
class CexApiSourcesService {
    /**
     * 获取Binance公告数据
     */
    static async fetchBinanceAnnouncements() {
        logger_1.Logger.info('🚀 开始从多个API源获取Binance公告...');
        // 按优先级排序
        const sources = [...this.BINANCE_SOURCES].sort((a, b) => b.priority - a.priority);
        for (const source of sources) {
            try {
                logger_1.Logger.info(`🔍 尝试数据源: ${source.name} (优先级: ${source.priority})`);
                const response = await anti_detection_service_1.AntiDetectionService.makeSmartRequest(source.url, {
                    params: source.params,
                    headers: {
                        ...source.headers,
                        'Referer': 'https://www.binance.com/zh-CN/support/announcement/',
                    },
                    meta: { exchange: 'binance' },
                });
                if (response.data) {
                    const announcements = source.parser(response.data);
                    if (announcements.length > 0) {
                        logger_1.Logger.info(`✅ ${source.name} 成功获取 ${announcements.length} 条公告`);
                        return announcements;
                    }
                    else {
                        logger_1.Logger.warn(`⚠️ ${source.name} 返回空数据`);
                    }
                }
            }
            catch (error) {
                logger_1.Logger.error(`❌ ${source.name} 失败:`, error.message);
                continue;
            }
        }
        logger_1.Logger.warn('所有Binance API源都失败，返回空数组');
        return [];
    }
    /**
     * 获取OKX公告数据
     */
    static async fetchOkxAnnouncements() {
        logger_1.Logger.info('🚀 开始从多个API源获取OKX公告...');
        const sources = [...this.OKX_SOURCES].sort((a, b) => b.priority - a.priority);
        for (const source of sources) {
            try {
                logger_1.Logger.info(`🔍 尝试数据源: ${source.name} (优先级: ${source.priority})`);
                const response = await anti_detection_service_1.AntiDetectionService.makeSmartRequest(source.url, {
                    params: source.params,
                    headers: {
                        ...source.headers,
                        'Referer': 'https://www.okx.com/zh-hans/help/',
                    },
                    meta: { exchange: 'okx' },
                });
                if (response.data) {
                    const announcements = source.parser(response.data);
                    if (announcements.length > 0) {
                        logger_1.Logger.info(`✅ ${source.name} 成功获取 ${announcements.length} 条公告`);
                        return announcements;
                    }
                    else {
                        logger_1.Logger.warn(`⚠️ ${source.name} 返回空数据`);
                    }
                }
            }
            catch (error) {
                logger_1.Logger.error(`❌ ${source.name} 失败:`, error.message);
                continue;
            }
        }
        logger_1.Logger.warn('所有OKX API源都失败，返回空数组');
        return [];
    }
    /**
     * 获取其他交易所公告数据
     */
    static async fetchOtherExchangeAnnouncements() {
        logger_1.Logger.info('🚀 开始获取其他交易所公告...');
        const results = await Promise.allSettled(this.OTHER_SOURCES.map(async (source) => {
            try {
                const response = await anti_detection_service_1.AntiDetectionService.makeSmartRequest(source.url, {
                    params: source.params,
                    headers: source.headers,
                });
                return source.parser(response.data);
            }
            catch (error) {
                logger_1.Logger.error(`${source.name} 获取失败:`, error);
                return [];
            }
        }));
        const allAnnouncements = [];
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                allAnnouncements.push(...result.value);
            }
        });
        return allAnnouncements;
    }
    /**
     * 解析Binance CMS API响应
     */
    static parseBinanceCmsResponse(data) {
        try {
            const articles = data?.data?.articles || data?.articles || [];
            return articles.map((article, index) => ({
                id: `binance_cms_${article.id || Date.now() + index}`,
                exchange: 'binance',
                title: article.title || '未知标题',
                content: article.summary || article.content || '详细信息请查看原文',
                category: this.mapBinanceCategory(article.catalogName || article.categoryName),
                importance: this.determineBinanceImportance(article.title),
                publishTime: new Date(article.releaseDate || article.publishDate || Date.now()).getTime(),
                tags: this.extractTokenTags(article.title),
                url: `https://www.binance.com/zh-CN/support/announcement/${article.code || article.id}`,
            }));
        }
        catch (error) {
            logger_1.Logger.error('解析Binance CMS响应失败:', error);
            return [];
        }
    }
    /**
     * 解析Binance Support API响应
     */
    static parseBinanceSupportResponse(data) {
        try {
            const catalogDetail = data?.data?.catalogDetail;
            const articles = catalogDetail?.articles || catalogDetail?.list || [];
            return articles.map((article, index) => ({
                id: `binance_support_${article.id || Date.now() + index}`,
                exchange: 'binance',
                title: article.title || '未知标题',
                content: article.content || article.summary || '详细信息请查看原文',
                category: this.mapBinanceCategory(article.type || article.catalogName),
                importance: this.determineBinanceImportance(article.title),
                publishTime: new Date(article.publishDate || article.releaseDate || Date.now()).getTime(),
                tags: this.extractTokenTags(article.title),
                url: `https://www.binance.com/zh-CN/support/announcement/${article.code || article.id}`,
            }));
        }
        catch (error) {
            logger_1.Logger.error('解析Binance Support响应失败:', error);
            return [];
        }
    }
    /**
     * 解析Binance News API响应
     */
    static parseBinanceNewsResponse(data) {
        try {
            const articles = data?.data || data?.list || [];
            return articles.map((article, index) => ({
                id: `binance_news_${article.articleId || article.id || Date.now() + index}`,
                exchange: 'binance',
                title: article.title || '未知标题',
                content: article.summary || article.content || '详细信息请查看原文',
                category: this.mapBinanceCategory(article.catalogName),
                importance: this.determineBinanceImportance(article.title),
                publishTime: new Date(article.releaseDate || Date.now()).getTime(),
                tags: this.extractTokenTags(article.title),
                url: `https://www.binance.com/zh-CN/support/announcement/${article.code || article.articleId}`,
            }));
        }
        catch (error) {
            logger_1.Logger.error('解析Binance News响应失败:', error);
            return [];
        }
    }
    /**
     * 解析Binance RSS响应
     */
    static parseBinanceRssResponse(data) {
        try {
            // 简单的RSS XML解析
            const itemMatches = data.match(/<item>(.*?)<\/item>/gs) || [];
            return itemMatches.map((item, index) => {
                const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
                const linkMatch = item.match(/<link>(.*?)<\/link>/);
                const descriptionMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
                const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
                const title = titleMatch ? titleMatch[1] : '未知标题';
                return {
                    id: `binance_rss_${Date.now() + index}`,
                    exchange: 'binance',
                    title,
                    content: descriptionMatch ? descriptionMatch[1] : '详细信息请查看原文',
                    category: this.mapBinanceCategory(title),
                    importance: this.determineBinanceImportance(title),
                    publishTime: pubDateMatch ? new Date(pubDateMatch[1]).getTime() : Date.now(),
                    tags: this.extractTokenTags(title),
                    url: linkMatch ? linkMatch[1] : 'https://www.binance.com/zh-CN/support/announcement/',
                };
            });
        }
        catch (error) {
            logger_1.Logger.error('解析Binance RSS响应失败:', error);
            return [];
        }
    }
    /**
     * 解析OKX Support API响应
     */
    static parseOkxSupportResponse(data) {
        try {
            const announcements = data?.data || data?.list || [];
            return announcements.map((item, index) => ({
                id: `okx_support_${item.id || Date.now() + index}`,
                exchange: 'okx',
                title: item.title || '未知标题',
                content: item.summary || item.content || '详细信息请查看原文',
                category: this.mapOkxCategory(item.category || item.type),
                importance: this.determineOkxImportance(item.title),
                publishTime: new Date(item.publishTime || item.createdAt || Date.now()).getTime(),
                tags: this.extractTokenTags(item.title),
                url: item.url || `https://www.okx.com/zh-hans/help/announcements/${item.id}`,
            }));
        }
        catch (error) {
            logger_1.Logger.error('解析OKX Support响应失败:', error);
            return [];
        }
    }
    /**
     * 解析OKX Help API响应
     */
    static parseOkxHelpResponse(data) {
        try {
            const announcements = data?.data?.announcements || data?.announcements || [];
            return announcements.map((item, index) => ({
                id: `okx_help_${item.id || Date.now() + index}`,
                exchange: 'okx',
                title: item.title || '未知标题',
                content: item.summary || item.description || '详细信息请查看原文',
                category: this.mapOkxCategory(item.category),
                importance: this.determineOkxImportance(item.title),
                publishTime: new Date(item.publishTime || Date.now()).getTime(),
                tags: this.extractTokenTags(item.title),
                url: `https://www.okx.com/zh-hans/help/announcements/${item.slug || item.id}`,
            }));
        }
        catch (error) {
            logger_1.Logger.error('解析OKX Help响应失败:', error);
            return [];
        }
    }
    /**
     * 解析OKX News API响应
     */
    static parseOkxNewsResponse(data) {
        try {
            const news = data?.data?.news || data?.news || [];
            return news.map((item, index) => ({
                id: `okx_news_${item.id || Date.now() + index}`,
                exchange: 'okx',
                title: item.title || '未知标题',
                content: item.summary || item.content || '详细信息请查看原文',
                category: this.mapOkxCategory(item.category),
                importance: this.determineOkxImportance(item.title),
                publishTime: new Date(item.publishedAt || item.createdAt || Date.now()).getTime(),
                tags: this.extractTokenTags(item.title),
                url: item.url || `https://www.okx.com/zh-hans/news/${item.slug || item.id}`,
            }));
        }
        catch (error) {
            logger_1.Logger.error('解析OKX News响应失败:', error);
            return [];
        }
    }
    /**
     * 解析Bybit响应
     */
    static parseBybitResponse(data) {
        try {
            const articles = data?.result?.list || data?.list || [];
            return articles.map((article, index) => ({
                id: `bybit_${article.id || Date.now() + index}`,
                exchange: 'bybit',
                title: article.title || '未知标题',
                content: article.summary || article.description || '详细信息请查看原文',
                category: this.mapGeneralCategory(article.category),
                importance: this.determineGeneralImportance(article.title),
                publishTime: new Date(article.publishTime || article.createdAt || Date.now()).getTime(),
                tags: this.extractTokenTags(article.title),
                url: `https://announcements.bybit.com/zh-CN/article/${article.id}`,
            }));
        }
        catch (error) {
            logger_1.Logger.error('解析Bybit响应失败:', error);
            return [];
        }
    }
    /**
     * 解析HTX响应
     */
    static parseHtxResponse(data) {
        // HTX的解析逻辑需要根据实际API响应格式来实现
        return [];
    }
    /**
     * 通用分类映射
     */
    static mapGeneralCategory(category) {
        if (!category)
            return 'general';
        const lowerCategory = category.toLowerCase();
        if (lowerCategory.includes('listing') || lowerCategory.includes('上线'))
            return 'new-listings';
        if (lowerCategory.includes('delisting') || lowerCategory.includes('下架'))
            return 'delisting';
        if (lowerCategory.includes('futures') || lowerCategory.includes('合约'))
            return 'derivatives';
        if (lowerCategory.includes('maintenance') || lowerCategory.includes('维护'))
            return 'maintenance';
        if (lowerCategory.includes('api'))
            return 'api-updates';
        return 'general';
    }
    /**
     * Binance分类映射
     */
    static mapBinanceCategory(categoryName) {
        if (!categoryName)
            return 'general';
        const lowerName = categoryName.toLowerCase();
        if (lowerName.includes('新币') || lowerName.includes('上线') || lowerName.includes('listing'))
            return 'new-listings';
        if (lowerName.includes('合约') || lowerName.includes('futures'))
            return 'derivatives';
        if (lowerName.includes('api'))
            return 'api-updates';
        if (lowerName.includes('维护') || lowerName.includes('maintenance'))
            return 'maintenance';
        return 'general';
    }
    /**
     * OKX分类映射
     */
    static mapOkxCategory(category) {
        return this.mapGeneralCategory(category);
    }
    /**
     * 判断Binance重要性
     */
    static determineBinanceImportance(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('上线') || lowerTitle.includes('listing') ||
            lowerTitle.includes('重要') || lowerTitle.includes('紧急')) {
            return 'high';
        }
        if (lowerTitle.includes('更新') || lowerTitle.includes('合约') ||
            lowerTitle.includes('api')) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * 判断OKX重要性
     */
    static determineOkxImportance(title) {
        return this.determineBinanceImportance(title);
    }
    /**
     * 判断通用重要性
     */
    static determineGeneralImportance(title) {
        return this.determineBinanceImportance(title);
    }
    /**
     * 提取代币标签
     */
    static extractTokenTags(title) {
        const tags = [];
        // 匹配代币符号 (3-8个大写字母)
        const tokenMatches = title.match(/\b[A-Z]{3,8}\b/g);
        if (tokenMatches) {
            // 常见的代币过滤
            const commonTokens = tokenMatches.filter(token => !['USD', 'CNY', 'EUR', 'GBP', 'API', 'NEW'].includes(token));
            tags.push(...commonTokens);
        }
        // 添加功能标签
        if (title.includes('上线') || title.toLowerCase().includes('listing'))
            tags.push('新币上线');
        if (title.includes('合约') || title.toLowerCase().includes('futures'))
            tags.push('合约');
        if (title.includes('现货') || title.toLowerCase().includes('spot'))
            tags.push('现货');
        if (title.includes('维护') || title.toLowerCase().includes('maintenance'))
            tags.push('维护');
        return tags.length > 0 ? [...new Set(tags)] : ['公告'];
    }
}
exports.CexApiSourcesService = CexApiSourcesService;
/**
 * Binance API数据源配置
 */
CexApiSourcesService.BINANCE_SOURCES = [
    {
        name: 'binance-cms-api',
        url: 'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query',
        priority: 10,
        params: {
            catalogId: 48, // 最新公告
            pageNo: 1,
            pageSize: 15,
            language: 'zh-CN',
        },
        headers: {
            'Content-Type': 'application/json',
            'BNC-FV': 'beNElYhVzpoxTeNiYr',
            'Client-SDK': 'Web',
            'Lang': 'zh-CN',
            'Device-Id': 'web_12345',
            'CSRFToken': 'undefined',
            'Referer': 'https://www.binance.com/zh-CN/support/announcement/c-48',
        },
        parser: (data) => CexApiSourcesService.parseBinanceCmsResponse(data),
    },
    {
        name: 'binance-support-api',
        url: 'https://www.binance.com/bapi/composite/v1/public/cms/article/catalog/list/query',
        priority: 8,
        params: {
            catalogId: 48,
            pageNo: 1,
            pageSize: 20,
            language: 'zh-CN',
        },
        parser: (data) => CexApiSourcesService.parseBinanceSupportResponse(data),
    },
    {
        name: 'binance-news-api',
        url: 'https://www.binance.com/gateway-api/v1/public/cms/article/list/query',
        priority: 6,
        params: {
            catalogId: 48,
            pageNo: 1,
            pageSize: 15,
        },
        parser: (data) => CexApiSourcesService.parseBinanceNewsResponse(data),
    },
    // RSS Feed作为备选方案
    {
        name: 'binance-rss',
        url: 'https://www.binance.com/zh-CN/support/rss/48',
        priority: 4,
        headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        parser: (data) => CexApiSourcesService.parseBinanceRssResponse(data),
    },
];
/**
 * OKX API数据源配置
 */
CexApiSourcesService.OKX_SOURCES = [
    {
        name: 'okx-support-api',
        url: 'https://www.okx.com/api/v5/support/announcements/categories',
        priority: 10,
        params: {
            locale: 'zh_CN',
            limit: 20,
            offset: 0,
            category: 'announcement',
        },
        headers: {
            'Content-Type': 'application/json',
            'OK-ACCESS-KEY': '',
            'Locale': 'zh_CN',
            'Referer': 'https://www.okx.com/zh-hans/help/section/announcements-latest-announcements',
        },
        parser: (data) => CexApiSourcesService.parseOkxSupportResponse(data),
    },
    {
        name: 'okx-help-api',
        url: 'https://www.okx.com/v3/c2c/support/homepage/announcements',
        priority: 8,
        params: {
            locale: 'zh-Hans',
            t: Date.now(),
        },
        parser: (data) => CexApiSourcesService.parseOkxHelpResponse(data),
    },
    {
        name: 'okx-news-api',
        url: 'https://www.okx.com/priapi/v1/news/list/news',
        priority: 6,
        params: {
            locale: 'zh_CN',
            category: 'announcement',
            limit: 15,
            offset: 0,
        },
        parser: (data) => CexApiSourcesService.parseOkxNewsResponse(data),
    },
];
/**
 * 其他交易所数据源
 */
CexApiSourcesService.OTHER_SOURCES = [
    // Bybit
    {
        name: 'bybit-announcements',
        url: 'https://announcements.bybit.com/zh-CN/api/article/list',
        priority: 5,
        params: {
            category: 'new_crypto',
            language: 'zh-CN',
            page: 1,
            limit: 10,
        },
        parser: (data) => CexApiSourcesService.parseBybitResponse(data),
    },
    // Huobi/HTX
    {
        name: 'htx-announcements',
        url: 'https://www.htx.com/support/zh-cn/hc/zh-cn/sections/announcements/articles',
        priority: 5,
        parser: (data) => CexApiSourcesService.parseHtxResponse(data),
    },
];
//# sourceMappingURL=cex-api-sources.service.js.map