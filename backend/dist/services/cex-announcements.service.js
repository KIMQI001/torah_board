"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CEXAnnouncementsService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
class CEXAnnouncementsService {
    /**
     * 获取Binance公告
     */
    static async getBinanceAnnouncements() {
        const cacheKey = 'binance_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            // Binance公告API
            const response = await axios_1.default.get('https://www.binance.com/bapi/composite/v1/public/cms/article/list/query', {
                params: {
                    type: 1,
                    catalogId: 48,
                    pageNo: 1,
                    pageSize: 20
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });
            const articles = response.data?.data?.articles || [];
            const announcements = articles.map((article) => {
                const title = article.title;
                const importance = this.determineImportance(title, article.content);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.content);
                return {
                    id: `binance_${article.id}`,
                    exchange: 'binance',
                    title: title,
                    content: article.content || '',
                    category,
                    importance,
                    publishTime: article.releaseDate,
                    tags,
                    url: `https://www.binance.com/en/support/announcement/${article.code}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Binance announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Binance announcements', { error });
            return [];
        }
    }
    /**
     * 获取OKX公告
     */
    static async getOKXAnnouncements() {
        const cacheKey = 'okx_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://www.okx.com/v2/support/home/getAnnouncementList', {
                params: {
                    t: Date.now(),
                    locale: 'en_US',
                    channelId: 2,
                    pageSize: 20,
                    pageIndex: 1
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            const articles = response.data?.data || [];
            const announcements = articles.map((article) => {
                const title = article.title;
                const importance = this.determineImportance(title, article.summary);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.summary);
                return {
                    id: `okx_${article.id}`,
                    exchange: 'okx',
                    title: title,
                    content: article.summary || '',
                    category,
                    importance,
                    publishTime: article.cTime,
                    tags,
                    url: `https://www.okx.com/support/hc/en-us/articles/${article.id}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} OKX announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch OKX announcements', { error });
            return [];
        }
    }
    /**
     * 获取Gate.io公告
     */
    static async getGateAnnouncements() {
        const cacheKey = 'gate_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://www.gate.io/json_svr/query/', {
                params: {
                    u: 'notice_list',
                    type: 'notice',
                    page: 1,
                    limit: 20,
                    lang: 'en'
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            const articles = response.data?.notices || [];
            const announcements = articles.map((article) => {
                const title = article.title;
                const importance = this.determineImportance(title, article.content);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.content);
                return {
                    id: `gate_${article.id}`,
                    exchange: 'gate',
                    title: title,
                    content: article.content || '',
                    category,
                    importance,
                    publishTime: article.ctime * 1000, // Convert to milliseconds
                    tags,
                    url: `https://www.gate.io/article/${article.id}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Gate.io announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Gate.io announcements', { error });
            return [];
        }
    }
    /**
     * 获取所有交易所公告
     */
    static async getAllAnnouncements(filter) {
        const promises = [
            this.getBinanceAnnouncements(),
            this.getOKXAnnouncements(),
            this.getGateAnnouncements()
        ];
        const results = await Promise.allSettled(promises);
        let allAnnouncements = [];
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                allAnnouncements.push(...result.value);
            }
        });
        // 应用过滤器
        if (filter) {
            allAnnouncements = this.applyFilter(allAnnouncements, filter);
        }
        // 按时间排序 (最新的在前)
        return allAnnouncements.sort((a, b) => b.publishTime - a.publishTime);
    }
    /**
     * 应用过滤器
     */
    static applyFilter(announcements, filter) {
        let filtered = announcements;
        if (filter.exchange) {
            filtered = filtered.filter(ann => ann.exchange === filter.exchange);
        }
        if (filter.category) {
            filtered = filtered.filter(ann => ann.category === filter.category);
        }
        if (filter.importance) {
            filtered = filtered.filter(ann => ann.importance === filter.importance);
        }
        if (filter.tags && filter.tags.length > 0) {
            filtered = filtered.filter(ann => filter.tags.some(tag => ann.tags.includes(tag)));
        }
        if (filter.dateFrom) {
            filtered = filtered.filter(ann => ann.publishTime >= filter.dateFrom);
        }
        if (filter.dateTo) {
            filtered = filtered.filter(ann => ann.publishTime <= filter.dateTo);
        }
        if (filter.limit) {
            filtered = filtered.slice(0, filter.limit);
        }
        return filtered;
    }
    /**
     * 确定公告重要性
     */
    static determineImportance(title, content) {
        const highPriorityKeywords = [
            'delisting', 'delist', 'suspension', 'suspend', 'halt', 'emergency',
            'security', 'hack', 'vulnerability', 'maintenance', 'upgrade',
            'new listing', 'launch', 'airdrop', 'promotion'
        ];
        const mediumPriorityKeywords = [
            'trading', 'deposit', 'withdrawal', 'update', 'improvement',
            'feature', 'support', 'margin', 'futures'
        ];
        const text = `${title} ${content}`.toLowerCase();
        if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
            return 'high';
        }
        if (mediumPriorityKeywords.some(keyword => text.includes(keyword))) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * 分类公告
     */
    static categorizeAnnouncement(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('listing') || titleLower.includes('launch')) {
            return 'listing';
        }
        if (titleLower.includes('delisting') || titleLower.includes('delist')) {
            return 'delisting';
        }
        if (titleLower.includes('trading') || titleLower.includes('trade')) {
            return 'trading';
        }
        if (titleLower.includes('maintenance') || titleLower.includes('upgrade')) {
            return 'maintenance';
        }
        if (titleLower.includes('airdrop') || titleLower.includes('promotion')) {
            return 'promotion';
        }
        if (titleLower.includes('security') || titleLower.includes('risk')) {
            return 'security';
        }
        if (titleLower.includes('deposit') || titleLower.includes('withdrawal')) {
            return 'wallet';
        }
        return 'general';
    }
    /**
     * 提取标签
     */
    static extractTags(title, content) {
        const text = `${title} ${content}`.toLowerCase();
        const tags = [];
        // 币种标签
        const cryptoPattern = /\b([A-Z]{3,5})\b/g;
        const titleMatches = title.match(cryptoPattern) || [];
        titleMatches.forEach(match => {
            if (match.length <= 5 && !['THE', 'AND', 'FOR', 'NEW'].includes(match)) {
                tags.push(match);
            }
        });
        // 功能标签
        const featureTags = [
            { keywords: ['spot', 'trading'], tag: 'spot-trading' },
            { keywords: ['margin'], tag: 'margin-trading' },
            { keywords: ['futures', 'perpetual'], tag: 'futures' },
            { keywords: ['options'], tag: 'options' },
            { keywords: ['staking', 'earn'], tag: 'staking' },
            { keywords: ['launchpad', 'ido'], tag: 'launchpad' },
            { keywords: ['api'], tag: 'api' },
            { keywords: ['mobile', 'app'], tag: 'mobile' },
            { keywords: ['web', 'website'], tag: 'web' }
        ];
        featureTags.forEach(({ keywords, tag }) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                tags.push(tag);
            }
        });
        return [...new Set(tags)]; // 去重
    }
    /**
     * 获取特定币种相关公告
     */
    static async getTokenRelatedAnnouncements(tokenSymbol) {
        const allAnnouncements = await this.getAllAnnouncements();
        return allAnnouncements.filter(ann => ann.title.toUpperCase().includes(tokenSymbol.toUpperCase()) ||
            ann.content.toUpperCase().includes(tokenSymbol.toUpperCase()) ||
            ann.tags.includes(tokenSymbol.toUpperCase()));
    }
    /**
     * 获取高优先级公告
     */
    static async getHighPriorityAnnouncements() {
        return this.getAllAnnouncements({ importance: 'high', limit: 50 });
    }
    /**
     * 清除缓存
     */
    static clearCache() {
        this.cache.clear();
        logger_1.Logger.info('CEX announcements cache cleared');
    }
}
exports.CEXAnnouncementsService = CEXAnnouncementsService;
CEXAnnouncementsService.REQUEST_TIMEOUT = 10000;
CEXAnnouncementsService.CACHE_TTL = 10 * 60 * 1000; // 10 minutes
CEXAnnouncementsService.cache = new Map();
//# sourceMappingURL=cex-announcements.service.js.map