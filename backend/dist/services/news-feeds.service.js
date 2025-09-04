"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsFeedsService = void 0;
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
const cex_announcements_service_1 = require("./cex-announcements.service");
const onchain_feeds_service_1 = require("./onchain-feeds.service");
class NewsFeedsService {
    /**
     * 将CEX公告转换为统一的快讯格式
     */
    static convertCEXAnnouncementToFeed(announcement) {
        return {
            id: `cex_${announcement.id}`,
            title: announcement.title,
            content: announcement.content,
            summary: announcement.content.length > 200 ?
                announcement.content.substring(0, 200) + '...' : announcement.content,
            source: 'cex',
            sourceUrl: announcement.url,
            category: announcement.category,
            importance: announcement.importance,
            exchange: announcement.exchange,
            symbols: announcement.tags.filter((tag) => /^[A-Z]{3,5}$/.test(tag) && !['THE', 'AND', 'FOR', 'NEW'].includes(tag)),
            tags: announcement.tags,
            metadata: {
                originalId: announcement.id,
                exchange: announcement.exchange
            },
            isHot: announcement.importance === 'high',
            isVerified: true,
            publishTime: new Date(announcement.publishTime),
            createdAt: new Date()
        };
    }
    /**
     * 将链上数据转换为统一的快讯格式
     */
    static convertOnChainToFeed(onChainEvent) {
        try {
            const symbols = onChainEvent.tokenSymbol ? [onChainEvent.tokenSymbol] : [];
            const tags = [
                onChainEvent.blockchain,
                onChainEvent.eventType,
                ...(onChainEvent.tokenSymbol ? [onChainEvent.tokenSymbol] : []),
                ...(onChainEvent.dexName ? [onChainEvent.dexName] : [])
            ].filter(Boolean);
            // 安全处理时间格式
            let publishTime;
            try {
                if (onChainEvent.timestamp instanceof Date) {
                    publishTime = onChainEvent.timestamp;
                }
                else if (typeof onChainEvent.timestamp === 'string') {
                    publishTime = new Date(onChainEvent.timestamp);
                }
                else {
                    publishTime = new Date();
                }
            }
            catch (err) {
                logger_1.Logger.warn('Failed to parse timestamp, using current date:', onChainEvent.timestamp);
                publishTime = new Date();
            }
            // 安全处理创建时间
            let createdAt;
            try {
                if (onChainEvent.createdAt instanceof Date) {
                    createdAt = onChainEvent.createdAt;
                }
                else if (typeof onChainEvent.createdAt === 'string') {
                    createdAt = new Date(onChainEvent.createdAt);
                }
                else {
                    createdAt = new Date();
                }
            }
            catch (err) {
                logger_1.Logger.warn('Failed to parse createdAt, using current date:', onChainEvent.createdAt);
                createdAt = new Date();
            }
            // 安全处理元数据
            let parsedMetadata = {};
            try {
                if (typeof onChainEvent.metadata === 'string') {
                    parsedMetadata = JSON.parse(onChainEvent.metadata);
                }
                else if (typeof onChainEvent.metadata === 'object' && onChainEvent.metadata !== null) {
                    parsedMetadata = onChainEvent.metadata;
                }
            }
            catch (err) {
                logger_1.Logger.warn('Failed to parse metadata:', onChainEvent.metadata);
                parsedMetadata = {};
            }
            const convertedFeed = {
                id: `onchain_${onChainEvent.id}`,
                title: onChainEvent.title || 'Unknown Event',
                content: onChainEvent.description || 'No description available',
                summary: onChainEvent.description && onChainEvent.description.length > 150 ?
                    onChainEvent.description.substring(0, 150) + '...' : onChainEvent.description || 'No description available',
                source: 'onchain',
                sourceUrl: NewsFeedsService.generateExplorerUrl(onChainEvent.transactionHash, onChainEvent.blockchain),
                category: NewsFeedsService.mapOnChainEventToCategory(onChainEvent.eventType),
                importance: onChainEvent.isAlert ? 'high' :
                    (onChainEvent.value && onChainEvent.value > 500000 ? 'medium' : 'low'),
                symbols,
                tags,
                metadata: {
                    blockchain: onChainEvent.blockchain,
                    transactionHash: onChainEvent.transactionHash,
                    value: onChainEvent.value,
                    gasUsed: onChainEvent.gasUsed,
                    eventType: onChainEvent.eventType,
                    ...parsedMetadata
                },
                isHot: onChainEvent.isAlert || (onChainEvent.value && onChainEvent.value > 1000000),
                isVerified: true,
                publishTime,
                createdAt
            };
            return convertedFeed;
        }
        catch (error) {
            logger_1.Logger.error('Error converting on-chain event to feed:', {
                error: error.message,
                eventId: onChainEvent?.id,
                stack: error.stack
            });
            throw error;
        }
    }
    /**
     * 生成区块链浏览器URL
     */
    static generateExplorerUrl(txHash, blockchain) {
        const explorers = {
            ethereum: 'https://etherscan.io/tx',
            solana: 'https://solscan.io/tx',
            bitcoin: 'https://blockstream.info/tx',
            bsc: 'https://bscscan.com/tx'
        };
        const baseUrl = explorers[blockchain] || explorers.ethereum;
        return `${baseUrl}/${txHash}`;
    }
    /**
     * 映射链上事件类型到快讯分类
     */
    static mapOnChainEventToCategory(eventType) {
        const mapping = {
            large_transfer: 'market',
            whale_activity: 'market',
            dex_swap: 'trading',
            nft_trade: 'market',
            liquidation: 'trading',
            bridge_activity: 'defi'
        };
        return mapping[eventType] || 'general';
    }
    /**
     * 从Lookonchain获取真实快讯数据
     */
    static async fetchLookonchainFeeds(limit = 10) {
        try {
            const response = await fetch('https://www.lookonchain.com/ashx/index.ashx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://www.lookonchain.com/',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams({
                    max_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    protype: '',
                    count: limit.toString()
                })
            });
            if (response.ok) {
                const data = await response.json();
                logger_1.Logger.info(`Successfully fetched ${data.length || 0} feeds from Lookonchain`);
                // 转换Lookonchain数据格式为我们的格式
                return this.convertLookonchainToFeeds(data);
            }
            else {
                logger_1.Logger.warn('Lookonchain API request failed, falling back to mock data', {
                    status: response.status,
                    statusText: response.statusText
                });
                return [];
            }
        }
        catch (error) {
            logger_1.Logger.warn('Failed to fetch from Lookonchain, using mock data', { error: error.message });
            return [];
        }
    }
    /**
     * 将Lookonchain数据转换为统一格式
     */
    static convertLookonchainToFeeds(lookonchainData) {
        if (!Array.isArray(lookonchainData))
            return [];
        return lookonchainData.map((item, index) => ({
            id: `lookonchain_${item.nnewflash_id || Date.now() + index}`,
            title: item.stitle || 'Blockchain Activity',
            content: item.sabstract || 'Real-time blockchain activity detected',
            summary: item.sabstract && item.sabstract.length > 150 ?
                item.sabstract.substring(0, 150) + '...' : item.sabstract || 'Real-time activity',
            source: 'onchain',
            sourceUrl: item.nnewflash_id ? `https://www.lookonchain.com/share/feeds_detail/${item.nnewflash_id}` : undefined,
            category: 'market',
            importance: item.is_hot ? 'high' : 'medium',
            symbols: this.extractSymbolsFromText(item.sabstract || ''),
            tags: ['lookonchain', 'blockchain', 'activity'],
            metadata: {
                originalId: item.nnewflash_id,
                isHot: item.is_hot,
                source: 'lookonchain'
            },
            isHot: item.is_hot || false,
            isVerified: true,
            publishTime: new Date(item.times || Date.now()),
            createdAt: new Date()
        }));
    }
    /**
     * 从文本中提取代币符号
     */
    static extractSymbolsFromText(text) {
        const symbolRegex = /\$([A-Z]{2,10})|([A-Z]{2,10})(?=\s|$)/g;
        const matches = text.match(symbolRegex) || [];
        return [...new Set(matches.map(match => match.replace('$', '').toUpperCase()))];
    }
    /**
     * 聚合所有来源的快讯数据
     */
    static async aggregateFeeds(filter) {
        const cacheKey = `feeds_${JSON.stringify(filter || {})}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            logger_1.Logger.debug('Returning cached feeds', { count: cached.data.length });
            return cached.data;
        }
        try {
            const allFeeds = [];
            // 优先尝试从Lookonchain获取真实数据
            try {
                const lookonchainFeeds = await this.fetchLookonchainFeeds(filter?.limit || 20);
                if (lookonchainFeeds.length > 0) {
                    allFeeds.push(...lookonchainFeeds);
                    logger_1.Logger.info(`Added ${lookonchainFeeds.length} feeds from Lookonchain`);
                }
            }
            catch (error) {
                logger_1.Logger.warn('Failed to fetch Lookonchain feeds, continuing with other sources', { error: error.message });
            }
            // 获取CEX公告数据（容错处理）
            if (!filter?.sources || filter.sources.includes('cex')) {
                try {
                    const cexAnnouncements = await cex_announcements_service_1.CEXAnnouncementsService.getAllAnnouncements({
                        limit: 50,
                        ...(filter?.exchanges && { exchange: filter.exchanges[0] }),
                        ...(filter?.importance && { importance: filter.importance })
                    });
                    const cexFeeds = cexAnnouncements.map(this.convertCEXAnnouncementToFeed);
                    allFeeds.push(...cexFeeds);
                }
                catch (error) {
                    logger_1.Logger.warn('CEX announcements unavailable, continuing with other sources', { error: error.message });
                }
            }
            // 获取链上数据
            if (!filter?.sources || filter.sources.includes('onchain')) {
                try {
                    logger_1.Logger.debug('Fetching on-chain events...');
                    const onChainEvents = await onchain_feeds_service_1.OnChainFeedsService.getOnChainFeeds({
                        limit: 30,
                        ...(filter?.symbols && filter.symbols.length > 0 && {
                            tokenSymbol: filter.symbols[0]
                        })
                    });
                    if (onChainEvents.length > 0) {
                        const onChainFeeds = onChainEvents.map((event) => this.convertOnChainToFeed(event));
                        allFeeds.push(...onChainFeeds);
                    }
                }
                catch (error) {
                    logger_1.Logger.error('Failed to get on-chain feeds', { error: error.message, stack: error.stack });
                }
            }
            // 应用过滤器
            let filteredFeeds = this.applyFilters(allFeeds, filter);
            // 按时间排序
            filteredFeeds = filteredFeeds.sort((a, b) => b.publishTime.getTime() - a.publishTime.getTime());
            // 应用限制
            if (filter?.limit) {
                filteredFeeds = filteredFeeds.slice(filter.offset || 0, (filter.offset || 0) + filter.limit);
            }
            // 缓存结果
            this.cache.set(cacheKey, { data: filteredFeeds, timestamp: Date.now() });
            logger_1.Logger.info(`Aggregated ${filteredFeeds.length} feeds from multiple sources`);
            return filteredFeeds;
        }
        catch (error) {
            logger_1.Logger.error('Failed to aggregate news feeds', { error, filter });
            throw new Error('Failed to aggregate news feeds');
        }
    }
    /**
     * 应用过滤器
     */
    static applyFilters(feeds, filter) {
        if (!filter)
            return feeds;
        let filtered = feeds;
        if (filter.categories && filter.categories.length > 0) {
            filtered = filtered.filter(feed => filter.categories.includes(feed.category));
        }
        if (filter.importance) {
            const importanceOrder = { high: 3, medium: 2, low: 1 };
            const minImportance = importanceOrder[filter.importance];
            filtered = filtered.filter(feed => importanceOrder[feed.importance] >= minImportance);
        }
        if (filter.symbols && filter.symbols.length > 0) {
            filtered = filtered.filter(feed => filter.symbols.some(symbol => feed.symbols.includes(symbol.toUpperCase()) ||
                feed.title.toUpperCase().includes(symbol.toUpperCase()) ||
                feed.content.toUpperCase().includes(symbol.toUpperCase())));
        }
        if (filter.exchanges && filter.exchanges.length > 0) {
            filtered = filtered.filter(feed => !feed.exchange || filter.exchanges.includes(feed.exchange));
        }
        if (filter.isHot !== undefined) {
            filtered = filtered.filter(feed => feed.isHot === filter.isHot);
        }
        if (filter.dateFrom) {
            filtered = filtered.filter(feed => feed.publishTime >= filter.dateFrom);
        }
        if (filter.dateTo) {
            filtered = filtered.filter(feed => feed.publishTime <= filter.dateTo);
        }
        return filtered;
    }
    /**
     * 保存快讯到数据库
     */
    static async saveFeedsToDatabase(feeds) {
        try {
            for (const feed of feeds) {
                await database_1.prisma.newsFeed.upsert({
                    where: { id: feed.id },
                    update: {
                        title: feed.title,
                        content: feed.content,
                        summary: feed.summary,
                        isHot: feed.isHot
                    },
                    create: {
                        id: feed.id,
                        title: feed.title,
                        content: feed.content,
                        summary: feed.summary,
                        source: feed.source,
                        sourceUrl: feed.sourceUrl,
                        category: feed.category,
                        importance: feed.importance,
                        exchange: feed.exchange,
                        symbols: JSON.stringify(feed.symbols),
                        tags: JSON.stringify(feed.tags),
                        metadata: JSON.stringify(feed.metadata || {}),
                        isHot: feed.isHot,
                        isVerified: feed.isVerified,
                        publishTime: feed.publishTime
                    }
                });
            }
            logger_1.Logger.info(`Saved ${feeds.length} feeds to database`);
        }
        catch (error) {
            logger_1.Logger.error('Failed to save feeds to database', { error });
            throw error;
        }
    }
    /**
     * 从数据库获取快讯
     */
    static async getFeedsFromDatabase(filter) {
        try {
            const whereClause = {};
            if (filter?.sources && filter.sources.length > 0) {
                whereClause.source = { in: filter.sources };
            }
            if (filter?.categories && filter.categories.length > 0) {
                whereClause.category = { in: filter.categories };
            }
            if (filter?.importance) {
                const importanceOrder = { low: 1, medium: 2, high: 3 };
                const minImportance = importanceOrder[filter.importance];
                whereClause.importance = {
                    in: Object.entries(importanceOrder)
                        .filter(([_, value]) => value >= minImportance)
                        .map(([key, _]) => key)
                };
            }
            if (filter?.exchanges && filter.exchanges.length > 0) {
                whereClause.exchange = { in: filter.exchanges };
            }
            if (filter?.isHot !== undefined) {
                whereClause.isHot = filter.isHot;
            }
            if (filter?.dateFrom || filter?.dateTo) {
                whereClause.publishTime = {};
                if (filter.dateFrom)
                    whereClause.publishTime.gte = filter.dateFrom;
                if (filter.dateTo)
                    whereClause.publishTime.lte = filter.dateTo;
            }
            const feeds = await database_1.prisma.newsFeed.findMany({
                where: whereClause,
                orderBy: { publishTime: 'desc' },
                take: filter?.limit || 50,
                skip: filter?.offset || 0
            });
            return feeds.map(feed => ({
                ...feed,
                symbols: JSON.parse(feed.symbols),
                tags: JSON.parse(feed.tags),
                metadata: feed.metadata ? JSON.parse(feed.metadata) : {}
            }));
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch feeds from database', { error, filter });
            throw error;
        }
    }
    /**
     * 获取热门快讯
     */
    static async getHotFeeds(limit = 20) {
        return this.aggregateFeeds({
            isHot: true,
            limit
        });
    }
    /**
     * 获取特定交易对相关快讯
     */
    static async getSymbolRelatedFeeds(symbol, limit = 30) {
        return this.aggregateFeeds({
            symbols: [symbol],
            limit
        });
    }
    /**
     * 获取高重要性快讯
     */
    static async getHighImportanceFeeds(limit = 25) {
        return this.aggregateFeeds({
            importance: 'high',
            limit
        });
    }
    /**
     * 定期聚合和保存快讯任务
     */
    static async aggregateFeedsTask() {
        try {
            logger_1.Logger.info('Starting news feeds aggregation task...');
            // 首先更新链上数据
            await onchain_feeds_service_1.OnChainFeedsService.updateOnChainFeedsTask();
            // 聚合所有快讯
            const allFeeds = await this.aggregateFeeds({
                limit: 100
            });
            if (allFeeds.length > 0) {
                await this.saveFeedsToDatabase(allFeeds);
                logger_1.Logger.info(`News feeds aggregation completed: ${allFeeds.length} feeds processed`);
            }
        }
        catch (error) {
            logger_1.Logger.error('News feeds aggregation task failed', { error });
            throw error;
        }
    }
    /**
     * 清除过期缓存
     */
    static clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * 清理旧快讯
     */
    static async cleanupOldFeeds(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const deleteResult = await database_1.prisma.newsFeed.deleteMany({
                where: {
                    publishTime: {
                        lt: cutoffDate
                    }
                }
            });
            logger_1.Logger.info(`Cleaned up ${deleteResult.count} old news feeds older than ${daysToKeep} days`);
        }
        catch (error) {
            logger_1.Logger.error('Failed to cleanup old news feeds', { error });
            throw error;
        }
    }
}
exports.NewsFeedsService = NewsFeedsService;
NewsFeedsService.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
NewsFeedsService.cache = new Map();
//# sourceMappingURL=news-feeds.service.js.map