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
            // Binance公告API - 获取中文内容
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
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'identity'
                }
            });
            const articles = response.data?.data?.catalogs?.[0]?.articles || [];
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
                    url: `https://www.binance.com/zh-CN/support/announcement/${article.code}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Binance announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Binance announcements', { error });
            // 返回模拟数据作为备用
            return this.getMockBinanceAnnouncements();
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
            const response = await axios_1.default.get('https://www.okx.com/api/v5/support/announcements', {
                params: {
                    limit: 20
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                }
            });
            const articles = response.data?.data?.[0]?.details || [];
            const announcements = articles.map((article, index) => {
                const title = article.title;
                const importance = this.determineImportance(title, '');
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, '');
                return {
                    id: `okx_${Date.now()}_${index}`,
                    exchange: 'okx',
                    title: title,
                    content: '',
                    category,
                    importance,
                    publishTime: parseInt(article.pTime),
                    tags,
                    url: article.url
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
     * 获取Coinbase Pro公告
     */
    static async getCoinbaseAnnouncements() {
        const cacheKey = 'coinbase_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://api.coinbase.com/v2/announcements', {
                params: {
                    limit: 20
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            const announcements_data = response.data?.data || [];
            const announcements = announcements_data.map((item) => {
                const title = item.title;
                const importance = this.determineImportance(title, item.body);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, item.body);
                return {
                    id: `coinbase_${item.id}`,
                    exchange: 'coinbase',
                    title: title,
                    content: item.body || '',
                    category,
                    importance,
                    publishTime: new Date(item.created_at).getTime(),
                    tags,
                    url: `https://www.coinbase.com/blog/${item.slug}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Coinbase announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Coinbase announcements', { error });
            return [];
        }
    }
    /**
     * 获取Kraken公告
     */
    static async getKrakenAnnouncements() {
        const cacheKey = 'kraken_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://support.kraken.com/hc/api/v2/articles', {
                params: {
                    'filter[section]': 360000080266, // Status updates section
                    sort_by: 'created_at',
                    sort_order: 'desc',
                    per_page: 20
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            const articles = response.data?.articles || [];
            const announcements = articles.map((article) => {
                const title = article.title;
                const importance = this.determineImportance(title, article.body);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.body);
                return {
                    id: `kraken_${article.id}`,
                    exchange: 'kraken',
                    title: title,
                    content: article.body || '',
                    category,
                    importance,
                    publishTime: new Date(article.created_at).getTime(),
                    tags,
                    url: article.html_url
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Kraken announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Kraken announcements', { error });
            return [];
        }
    }
    /**
     * 获取Bybit公告
     */
    static async getBybitAnnouncements() {
        const cacheKey = 'bybit_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://api.bybit.com/v5/announcements/index', {
                params: {
                    locale: 'en-US',
                    page: 1,
                    limit: 20
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            const articles = response.data?.result?.list || [];
            const announcements = articles.map((article) => {
                const title = article.title;
                const importance = this.determineImportance(title, article.description);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.description);
                return {
                    id: `bybit_${article.id}`,
                    exchange: 'bybit',
                    title: title,
                    content: article.description || '',
                    category,
                    importance,
                    publishTime: article.publishTime || Date.now(),
                    tags,
                    url: `https://www.bybit.com/en-US/announcement-info/${article.id}/`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Bybit announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Bybit announcements', { error });
            return [];
        }
    }
    /**
     * 获取Huobi公告
     */
    static async getHuobiAnnouncements() {
        const cacheKey = 'huobi_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://www.htx.com/support/public/getNoticeList', {
                params: {
                    language: 'en-US',
                    r: Date.now(),
                    page: 1,
                    limit: 20
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
                const importance = this.determineImportance(title, article.content);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.content);
                return {
                    id: `huobi_${article.id}`,
                    exchange: 'huobi',
                    title: title,
                    content: article.content || '',
                    category,
                    importance,
                    publishTime: article.publishTime,
                    tags,
                    url: `https://www.htx.com/support/notice/${article.id}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Huobi announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Huobi announcements', { error });
            return [];
        }
    }
    /**
     * 获取KuCoin公告
     */
    static async getKuCoinAnnouncements() {
        const cacheKey = 'kucoin_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://www.kucoin.com/_api/cms/articles', {
                params: {
                    page: 1,
                    pageSize: 20,
                    lang: 'en_US'
                },
                timeout: this.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            const articles = response.data?.items || [];
            const announcements = articles.map((article) => {
                const title = article.title;
                const importance = this.determineImportance(title, article.summary);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.summary);
                return {
                    id: `kucoin_${article.id}`,
                    exchange: 'kucoin',
                    title: title,
                    content: article.summary || '',
                    category,
                    importance,
                    publishTime: article.publish_ts * 1000,
                    tags,
                    url: `https://www.kucoin.com/news${article.path}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} KuCoin announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch KuCoin announcements', { error });
            return [];
        }
    }
    /**
     * 获取Bitget公告
     */
    static async getBitgetAnnouncements() {
        const cacheKey = 'bitget_announcements';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get('https://www.bitget.com/api/v1/public/annoucements', {
                params: {
                    language: 'en_US',
                    page: 1,
                    limit: 20,
                    annType: 'all'
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
                const importance = this.determineImportance(title, article.content);
                const category = this.categorizeAnnouncement(title);
                const tags = this.extractTags(title, article.content);
                return {
                    id: `bitget_${article.id}`,
                    exchange: 'bitget',
                    title: title,
                    content: article.content || '',
                    category,
                    importance,
                    publishTime: article.publishTime,
                    tags,
                    url: `https://www.bitget.com/support/articles/${article.id}`
                };
            });
            this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
            logger_1.Logger.info(`Fetched ${announcements.length} Bitget announcements`);
            return announcements;
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch Bitget announcements', { error });
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
            this.getGateAnnouncements(),
            this.getCoinbaseAnnouncements(),
            this.getKrakenAnnouncements(),
            this.getBybitAnnouncements(),
            this.getHuobiAnnouncements(),
            this.getKuCoinAnnouncements(),
            this.getBitgetAnnouncements()
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
        const text = `${title} ${content}`.toLowerCase();
        // 高优先级关键词 - 影响交易的重要事件
        const highPriorityKeywords = [
            'delisting', 'delist', '下架', '停止交易',
            'suspension', 'suspend', 'halt', '暂停',
            'emergency', 'urgent', '紧急', '重要',
            'security', 'hack', 'vulnerability', '安全', '漏洞',
            'maintenance', 'upgrade', '维护', '升级',
            'new listing', 'launch', '新币', '上线',
            'airdrop', '空投',
            'fork', '分叉',
            'burn', '销毁',
            'snapshot', '快照'
        ];
        // 中优先级关键词 - 功能和服务相关
        const mediumPriorityKeywords = [
            'trading', '交易',
            'deposit', 'withdrawal', '充值', '提现',
            'update', 'improvement', '更新', '改进',
            'feature', 'support', '功能', '支持',
            'margin', 'futures', 'options', '杠杆', '期货', '期权',
            'staking', 'earn', '质押', '理财',
            'api', 'mobile', 'app', '应用',
            'promotion', 'bonus', '活动', '奖励'
        ];
        // 高优先级判断
        if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
            return 'high';
        }
        // 中优先级判断
        if (mediumPriorityKeywords.some(keyword => text.includes(keyword))) {
            return 'medium';
        }
        // 基于标题长度和内容复杂度的补充判断
        if (title.length > 50 || content.length > 200) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * 分类公告
     */
    static categorizeAnnouncement(title) {
        const titleLower = title.toLowerCase();
        // 新币上线
        if (titleLower.includes('listing') || titleLower.includes('launch') ||
            titleLower.includes('新币') || titleLower.includes('上线')) {
            return 'listing';
        }
        // 下架/停止交易
        if (titleLower.includes('delisting') || titleLower.includes('delist') ||
            titleLower.includes('下架') || titleLower.includes('停止交易')) {
            return 'delisting';
        }
        // 交易相关
        if (titleLower.includes('trading') || titleLower.includes('trade') ||
            titleLower.includes('交易') || titleLower.includes('spot') ||
            titleLower.includes('现货')) {
            return 'trading';
        }
        // 合约/衍生品
        if (titleLower.includes('futures') || titleLower.includes('perpetual') ||
            titleLower.includes('margin') || titleLower.includes('options') ||
            titleLower.includes('合约') || titleLower.includes('杠杆') || titleLower.includes('期权')) {
            return 'derivatives';
        }
        // 质押理财
        if (titleLower.includes('staking') || titleLower.includes('earn') ||
            titleLower.includes('saving') || titleLower.includes('质押') ||
            titleLower.includes('理财') || titleLower.includes('挖矿')) {
            return 'earn';
        }
        // 维护升级
        if (titleLower.includes('maintenance') || titleLower.includes('upgrade') ||
            titleLower.includes('维护') || titleLower.includes('升级') ||
            titleLower.includes('update') || titleLower.includes('更新')) {
            return 'maintenance';
        }
        // 活动促销
        if (titleLower.includes('airdrop') || titleLower.includes('promotion') ||
            titleLower.includes('campaign') || titleLower.includes('bonus') ||
            titleLower.includes('空投') || titleLower.includes('活动') ||
            titleLower.includes('奖励') || titleLower.includes('促销')) {
            return 'promotion';
        }
        // 安全相关
        if (titleLower.includes('security') || titleLower.includes('risk') ||
            titleLower.includes('hack') || titleLower.includes('vulnerability') ||
            titleLower.includes('安全') || titleLower.includes('风险') ||
            titleLower.includes('漏洞')) {
            return 'security';
        }
        // 充值提现
        if (titleLower.includes('deposit') || titleLower.includes('withdrawal') ||
            titleLower.includes('wallet') || titleLower.includes('充值') ||
            titleLower.includes('提现') || titleLower.includes('钱包')) {
            return 'wallet';
        }
        // API相关
        if (titleLower.includes('api') || titleLower.includes('接口')) {
            return 'api';
        }
        // 移动端
        if (titleLower.includes('mobile') || titleLower.includes('app') ||
            titleLower.includes('移动') || titleLower.includes('手机')) {
            return 'mobile';
        }
        // 法规政策
        if (titleLower.includes('regulatory') || titleLower.includes('compliance') ||
            titleLower.includes('legal') || titleLower.includes('法规') ||
            titleLower.includes('合规') || titleLower.includes('政策')) {
            return 'regulatory';
        }
        // 服务公告
        if (titleLower.includes('service') || titleLower.includes('notice') ||
            titleLower.includes('announcement') || titleLower.includes('服务') ||
            titleLower.includes('公告') || titleLower.includes('通知')) {
            return 'service';
        }
        return 'general';
    }
    /**
     * 提取标签
     */
    static extractTags(title, content) {
        const text = `${title} ${content}`.toLowerCase();
        const tags = [];
        // 币种标签 - 改进的正则表达式，更精确地识别加密货币符号
        const cryptoPattern = /\b([A-Z]{3,5}(?:USDT|USDC|BUSD|USD|BTC|ETH)?)\b/g;
        const titleMatches = title.match(cryptoPattern) || [];
        titleMatches.forEach(match => {
            // 过滤掉常见的非币种词汇
            const excludeWords = ['THE', 'AND', 'FOR', 'NEW', 'GET', 'SET', 'API', 'APP', 'WEB', 'VIP', 'FAQ'];
            if (match.length >= 3 && match.length <= 8 && !excludeWords.includes(match)) {
                tags.push(match);
            }
        });
        // 功能标签 - 扩展功能识别
        const featureTags = [
            { keywords: ['spot', 'trading', '现货', '交易'], tag: 'spot-trading' },
            { keywords: ['margin', '杠杆'], tag: 'margin-trading' },
            { keywords: ['futures', 'perpetual', '期货', '合约'], tag: 'futures' },
            { keywords: ['options', '期权'], tag: 'options' },
            { keywords: ['staking', 'earn', '质押', '理财', '挖矿'], tag: 'staking' },
            { keywords: ['launchpad', 'ido', 'launchpool', '新币挖矿'], tag: 'launchpad' },
            { keywords: ['airdrop', '空投'], tag: 'airdrop' },
            { keywords: ['api', '接口'], tag: 'api' },
            { keywords: ['mobile', 'app', '移动端', '手机'], tag: 'mobile' },
            { keywords: ['web', 'website', '网站'], tag: 'web' },
            { keywords: ['deposit', 'withdrawal', '充值', '提现'], tag: 'wallet' },
            { keywords: ['maintenance', '维护', '升级'], tag: 'maintenance' },
            { keywords: ['security', '安全', '风险'], tag: 'security' },
            { keywords: ['listing', 'launch', '上线', '新币'], tag: 'new-listing' },
            { keywords: ['delisting', '下架', '停止'], tag: 'delisting' },
            { keywords: ['promotion', 'bonus', '活动', '奖励'], tag: 'promotion' },
            { keywords: ['kyc', 'verification', '认证'], tag: 'kyc' },
            { keywords: ['p2p', 'otc', 'fiat', '法币'], tag: 'fiat' }
        ];
        featureTags.forEach(({ keywords, tag }) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                tags.push(tag);
            }
        });
        // 网络标签
        const networkTags = [
            { keywords: ['ethereum', 'eth', 'erc20', 'erc-20'], tag: 'ethereum' },
            { keywords: ['binance smart chain', 'bsc', 'bep20', 'bep-20'], tag: 'bsc' },
            { keywords: ['polygon', 'matic'], tag: 'polygon' },
            { keywords: ['solana', 'sol', 'spl'], tag: 'solana' },
            { keywords: ['avalanche', 'avax'], tag: 'avalanche' },
            { keywords: ['fantom', 'ftm'], tag: 'fantom' },
            { keywords: ['arbitrum'], tag: 'arbitrum' },
            { keywords: ['optimism'], tag: 'optimism' },
            { keywords: ['tron', 'trx', 'trc20', 'trc-20'], tag: 'tron' }
        ];
        networkTags.forEach(({ keywords, tag }) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                tags.push(tag);
            }
        });
        // 时间相关标签
        if (text.includes('emergency') || text.includes('urgent') || text.includes('紧急')) {
            tags.push('urgent');
        }
        if (text.includes('scheduled') || text.includes('planned') || text.includes('计划')) {
            tags.push('scheduled');
        }
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
    /**
     * Binance模拟数据
     */
    static getMockBinanceAnnouncements() {
        return [
            {
                id: 'binance_mock_1',
                exchange: 'binance',
                title: 'Binance Will List TRUMP (TRUMP) with Seed Tag Applied',
                content: 'Fellow Binancians, Binance will list TRUMP (TRUMP) and open trading for TRUMP/BTC, TRUMP/USDT, TRUMP/TRY trading pairs.',
                category: 'listing',
                importance: 'high',
                publishTime: Date.now() - 3600000,
                tags: ['TRUMP', 'new-listing', 'spot-trading'],
                url: 'https://www.binance.com/en/support/announcement/binance-will-list-trump'
            },
            {
                id: 'binance_mock_2',
                exchange: 'binance',
                title: 'Notice of Removal of Spot Trading Pairs - 2025-09-03',
                content: 'This is to announce that Binance will remove and cease trading on the following spot trading pairs.',
                category: 'delisting',
                importance: 'high',
                publishTime: Date.now() - 7200000,
                tags: ['delisting', 'spot-trading'],
                url: 'https://www.binance.com/en/support/announcement/notice-of-removal'
            }
        ];
    }
}
exports.CEXAnnouncementsService = CEXAnnouncementsService;
CEXAnnouncementsService.REQUEST_TIMEOUT = 10000;
CEXAnnouncementsService.CACHE_TTL = 10 * 60 * 1000; // 10 minutes
CEXAnnouncementsService.cache = new Map();
//# sourceMappingURL=cex-announcements.service.js.map