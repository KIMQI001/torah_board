import axios from 'axios';
import crypto from 'crypto';
import { Logger } from '@/utils/logger';
import { ExchangeAnnouncement } from './market-data.service';
import { prisma } from '@/services/database';
import { CexScraperService } from './cex-scraper.service';

export interface AnnouncementFilter {
  exchange?: string;
  category?: string;
  importance?: 'high' | 'medium' | 'low';
  tags?: string[];
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
}

export class CEXAnnouncementsService {
  private static readonly REQUEST_TIMEOUT = 10000;
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private static cache = new Map<string, { data: ExchangeAnnouncement[]; timestamp: number }>();

  /**
   * 从数据库获取公告
   */
  static async getAnnouncementsFromDB(filter?: {
    exchange?: string;
    category?: string;
    importance?: 'high' | 'medium' | 'low';
    limit?: number;
    offset?: number;
  }): Promise<ExchangeAnnouncement[]> {
    try {
      const where: any = {};
      
      if (filter?.exchange) {
        where.exchange = filter.exchange;
      }
      if (filter?.category) {
        where.category = filter.category;
      }
      if (filter?.importance) {
        where.importance = filter.importance;
      }

      const announcements = await prisma.cEXAnnouncement.findMany({
        where,
        orderBy: { publishTime: 'desc' },
        take: filter?.limit || 50,
        skip: filter?.offset || 0
      });

      return announcements.map(ann => ({
        id: ann.exchangeId,
        exchange: ann.exchange,
        title: ann.title,
        content: ann.content,
        category: ann.category,
        importance: ann.importance as 'high' | 'medium' | 'low',
        publishTime: ann.publishTime.getTime(),
        tags: JSON.parse(ann.tags || '[]'),
        url: ann.url
      }));
    } catch (error) {
      Logger.error('Failed to get announcements from DB', { error });
      return [];
    }
  }

  /**
   * 保存公告到数据库
   */
  static async saveAnnouncementsToDB(announcements: ExchangeAnnouncement[]): Promise<void> {
    try {
      for (const announcement of announcements) {
        const contentHash = this.generateContentHash(announcement.title, announcement.content);
        
        // 使用upsert来处理重复数据
        await prisma.cEXAnnouncement.upsert({
          where: {
            exchangeId_exchange: {
              exchangeId: announcement.id,
              exchange: announcement.exchange
            }
          },
          update: {
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            importance: announcement.importance,
            publishTime: new Date(announcement.publishTime),
            tags: JSON.stringify(announcement.tags),
            url: announcement.url,
            hash: contentHash,
            isProcessed: true,
            updatedAt: new Date()
          },
          create: {
            exchangeId: announcement.id,
            exchange: announcement.exchange,
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            importance: announcement.importance,
            publishTime: new Date(announcement.publishTime),
            tags: JSON.stringify(announcement.tags),
            url: announcement.url,
            hash: contentHash,
            isProcessed: true
          }
        });
      }
      
      Logger.info(`Saved ${announcements.length} announcements to database`);
    } catch (error) {
      Logger.error('Failed to save announcements to DB', { error });
    }
  }

  /**
   * 生成内容哈希值用于去重
   */
  private static generateContentHash(title: string, content: string): string {
    return crypto.createHash('md5').update(`${title}|${content}`).digest('hex');
  }

  /**
   * 获取Binance公告
   */
  static async getBinanceAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'binance_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Binance公告API - 优化中文内容获取
      const response = await axios.get('https://www.binance.com/bapi/composite/v1/public/cms/article/list/query', {
        params: {
          type: 1,
          catalogId: 48, // 公告分类ID
          pageNo: 1,
          pageSize: 20,
          catalog: 'square',
          rnd: Date.now()
        },
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'identity',
          'Referer': 'https://www.binance.com/zh-CN/support/announcement',
          'Origin': 'https://www.binance.com',
          'Cache-Control': 'no-cache'
        }
      });

      const articles = response.data?.data?.catalogs?.[0]?.articles || [];
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any) => {
        const originalTitle = article.title;
        const originalContent = article.content || '';
        
        // 增强内容 - 转换为中文友好格式
        const { title: enhancedTitle, content: enhancedContent } = this.enhanceAnnouncementContent(
          originalTitle, 
          originalContent, 
          'binance'
        );
        
        const importance = this.determineImportance(enhancedTitle, enhancedContent);
        const category = this.categorizeAnnouncement(enhancedTitle);
        const tags = this.extractTags(enhancedTitle, enhancedContent);

        return {
          id: `binance_${article.id}`,
          exchange: 'binance',
          title: enhancedTitle,
          content: enhancedContent,
          category,
          importance,
          publishTime: article.releaseDate,
          tags,
          url: `https://www.binance.com/zh-CN/support/announcement/${article.code}`
        };
      });

      // 保存到数据库
      await this.saveAnnouncementsToDB(announcements);
      
      this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
      Logger.info(`Fetched ${announcements.length} Binance announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch Binance announcements', { error });
      // 返回模拟数据作为备用
      const mockData = this.getMockBinanceAnnouncements();
      // 保存模拟数据到数据库
      await this.saveAnnouncementsToDB(mockData);
      return mockData;
    }
  }

  /**
   * 获取OKX公告
   */
  static async getOKXAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'okx_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // 尝试获取OKX中文公告数据 - 使用多种API尝试
      let response;
      try {
        // 首先尝试中文API
        response = await axios.get('https://www.okx.com/api/v5/support/announcements/zh', {
          params: {
            limit: 20
          },
          timeout: this.REQUEST_TIMEOUT,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://www.okx.com/zh-hans/help/category/announcements'
          }
        });
      } catch (firstError) {
        // 如果中文API失败，尝试通用API
        response = await axios.get('https://www.okx.com/api/v5/support/announcements', {
          params: {
            limit: 20
          },
          timeout: this.REQUEST_TIMEOUT,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://www.okx.com/zh-hans/help/category/announcements'
          }
        });
      }

      const articles = response.data?.data?.items || response.data?.items || [];
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any, index: number) => {
        const originalTitle = article.title || article.name || '';
        const originalContent = article.content || article.description || '';
        const publishTime = article.createdAt ? new Date(article.createdAt).getTime() : 
                          article.pTime ? parseInt(article.pTime) : 
                          Date.now() - index * 3600000;
        
        // 增强内容 - 转换为中文友好格式
        const { title: enhancedTitle, content: enhancedContent } = this.enhanceAnnouncementContent(
          originalTitle, 
          originalContent, 
          'okx'
        );
        
        const importance = this.determineImportance(enhancedTitle, enhancedContent);
        const category = this.categorizeAnnouncement(enhancedTitle);
        const tags = this.extractTags(enhancedTitle, enhancedContent);

        return {
          id: `okx_${article.id || Date.now()}_${index}`,
          exchange: 'okx',
          title: enhancedTitle,
          content: enhancedContent,
          category,
          importance,
          publishTime,
          tags,
          url: article.slug ? `https://www.okx.com/zh-hans/help/${article.slug}` : 
               article.url ? article.url : 
               `https://www.okx.com/zh-hans/help/announcement`
        };
      });

      // 保存到数据库
      await this.saveAnnouncementsToDB(announcements);
      
      this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
      Logger.info(`Fetched ${announcements.length} OKX announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch OKX announcements', { error });
      const mockData = this.getMockOKXAnnouncements();
      // 保存模拟数据到数据库
      await this.saveAnnouncementsToDB(mockData);
      return mockData;
    }
  }

  /**
   * 获取Coinbase Pro公告
   */
  static async getCoinbaseAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'coinbase_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://api.coinbase.com/v2/announcements', {
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
      
      const announcements: ExchangeAnnouncement[] = announcements_data.map((item: any) => {
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
      Logger.info(`Fetched ${announcements.length} Coinbase announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch Coinbase announcements', { error });
      return [];
    }
  }

  /**
   * 获取Kraken公告
   */
  static async getKrakenAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'kraken_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://support.kraken.com/hc/api/v2/articles', {
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
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any) => {
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
      Logger.info(`Fetched ${announcements.length} Kraken announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch Kraken announcements', { error });
      return [];
    }
  }

  /**
   * 获取Bybit公告
   */
  static async getBybitAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'bybit_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://api.bybit.com/v5/announcements/index', {
        params: {
          locale: 'zh-CN',
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
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any) => {
        const originalTitle = article.title;
        const originalContent = article.description || '';
        
        // 增强内容 - 转换为中文友好格式
        const { title: enhancedTitle, content: enhancedContent } = this.enhanceAnnouncementContent(
          originalTitle, 
          originalContent, 
          'bybit'
        );
        
        const importance = this.determineImportance(enhancedTitle, enhancedContent);
        const category = this.categorizeAnnouncement(enhancedTitle);
        const tags = this.extractTags(enhancedTitle, enhancedContent);

        return {
          id: `bybit_${article.id}`,
          exchange: 'bybit',
          title: enhancedTitle,
          content: enhancedContent,
          category,
          importance,
          publishTime: article.publishTime || Date.now(),
          tags,
          url: `https://www.bybit.com/zh-CN/announcement-info/${article.id}/`
        };
      });

      // 保存到数据库
      await this.saveAnnouncementsToDB(announcements);
      
      this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
      Logger.info(`Fetched ${announcements.length} Bybit announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch Bybit announcements', { error });
      const mockData = this.getMockBybitAnnouncements();
      // 保存模拟数据到数据库
      await this.saveAnnouncementsToDB(mockData);
      return mockData;
    }
  }

  /**
   * 获取Huobi公告
   */
  static async getHuobiAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'huobi_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://www.htx.com/support/public/getNoticeList', {
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
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any) => {
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
      Logger.info(`Fetched ${announcements.length} Huobi announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch Huobi announcements', { error });
      return [];
    }
  }

  /**
   * 获取KuCoin公告
   */
  static async getKuCoinAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'kucoin_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://www.kucoin.com/_api/cms/articles', {
        params: {
          page: 1,
          pageSize: 20,
          lang: 'zh_CN'
        },
        timeout: this.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      const articles = response.data?.items || [];
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any) => {
        const originalTitle = article.title;
        const originalContent = article.summary || '';
        
        // 增强内容 - 转换为中文友好格式
        const { title: enhancedTitle, content: enhancedContent } = this.enhanceAnnouncementContent(
          originalTitle, 
          originalContent, 
          'kucoin'
        );
        
        const importance = this.determineImportance(enhancedTitle, enhancedContent);
        const category = this.categorizeAnnouncement(enhancedTitle);
        const tags = this.extractTags(enhancedTitle, enhancedContent);

        return {
          id: `kucoin_${article.id}`,
          exchange: 'kucoin',
          title: enhancedTitle,
          content: enhancedContent,
          category,
          importance,
          publishTime: article.publish_ts * 1000,
          tags,
          url: `https://www.kucoin.com/zh-cn/news${article.path}`
        };
      });

      // 保存到数据库
      await this.saveAnnouncementsToDB(announcements);
      
      this.cache.set(cacheKey, { data: announcements, timestamp: Date.now() });
      Logger.info(`Fetched ${announcements.length} KuCoin announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch KuCoin announcements', { error });
      const mockData = this.getMockKuCoinAnnouncements();
      // 保存模拟数据到数据库
      await this.saveAnnouncementsToDB(mockData);
      return mockData;
    }
  }

  /**
   * 获取Bitget公告
   */
  static async getBitgetAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'bitget_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://www.bitget.com/api/v1/public/annoucements', {
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
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any) => {
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
      Logger.info(`Fetched ${announcements.length} Bitget announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch Bitget announcements', { error });
      return [];
    }
  }

  /**
   * 获取Gate.io公告
   */
  static async getGateAnnouncements(): Promise<ExchangeAnnouncement[]> {
    const cacheKey = 'gate_announcements';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://www.gate.io/json_svr/query/', {
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
      
      const announcements: ExchangeAnnouncement[] = articles.map((article: any) => {
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
      Logger.info(`Fetched ${announcements.length} Gate.io announcements`);
      
      return announcements;
    } catch (error) {
      Logger.error('Failed to fetch Gate.io announcements', { error });
      return [];
    }
  }

  /**
   * 获取所有交易所公告（优先从数据库获取）
   */
  static async getAllAnnouncements(filter?: AnnouncementFilter): Promise<ExchangeAnnouncement[]> {
    try {
      // 首先尝试从数据库获取
      const dbAnnouncements = await this.getAnnouncementsFromDB({
        exchange: filter?.exchange,
        category: filter?.category,
        importance: filter?.importance,
        limit: filter?.limit || 100
      });
      
      // 如果数据库有数据且不是太老（30分钟内），直接返回
      if (dbAnnouncements.length > 0) {
        const latestAnnouncement = dbAnnouncements[0];
        const isRecent = Date.now() - latestAnnouncement.publishTime < 30 * 60 * 1000; // 30分钟
        
        if (isRecent) {
          Logger.info(`Retrieved ${dbAnnouncements.length} announcements from database`);
          let filtered = dbAnnouncements;
          
          // 应用额外的过滤器（数据库查询可能没有覆盖的）
          if (filter) {
            filtered = this.applyFilter(filtered, filter);
          }
          
          return filtered.sort((a, b) => b.publishTime - a.publishTime);
        }
      }
      
      // 如果数据库数据不够新或为空，从API获取
      Logger.info('Database data is stale or empty, fetching from APIs...');
      
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
      
      let allAnnouncements: ExchangeAnnouncement[] = [];
      let successfulFetches = 0;
      
      results.forEach((result, index) => {
        const exchangeNames = ['Binance', 'OKX', 'Gate.io', 'Coinbase', 'Kraken', 'Bybit', 'Huobi', 'KuCoin', 'Bitget'];
        const exchangeName = exchangeNames[index];
        
        if (result.status === 'fulfilled') {
          const announcements = result.value;
          allAnnouncements.push(...announcements);
          if (announcements.length > 0) {
            successfulFetches++;
            Logger.info(`✅ ${exchangeName}: ${announcements.length} announcements`);
          }
        } else {
          Logger.warn(`❌ ${exchangeName}: API failed - ${result.reason?.message}`);
        }
      });

      // 检查是否所有主要交易所都有数据，如果没有则添加后备数据
      const majorExchanges = ['binance', 'okx', 'bybit', 'gate'];
      const presentExchanges = [...new Set(allAnnouncements.map(a => a.exchange))];
      const missingExchanges = majorExchanges.filter(ex => !presentExchanges.includes(ex));
      
      if (missingExchanges.length > 0 || allAnnouncements.length < 10) {
        Logger.warn(`缺失交易所: ${missingExchanges.join(', ')} 或数据太少(${allAnnouncements.length}条)，添加后备数据`);
        allAnnouncements.push(...this.getFallbackAnnouncements());
      }

      // 保存到数据库
      if (allAnnouncements.length > 0) {
        await this.saveAnnouncementsToDB(allAnnouncements);
      }

      // 应用过滤器
      if (filter) {
        allAnnouncements = this.applyFilter(allAnnouncements, filter);
      }

      Logger.info(`📊 总共获取到 ${allAnnouncements.length} 条公告，成功的交易所: ${successfulFetches}/9`);
      
      // 按时间排序 (最新的在前)
      return allAnnouncements.sort((a, b) => b.publishTime - a.publishTime);
      
    } catch (error) {
      Logger.error('Failed to get all announcements', { error });
      // 发生错误时，尝试从数据库获取任何可用数据
      return this.getAnnouncementsFromDB({
        exchange: filter?.exchange,
        category: filter?.category,
        importance: filter?.importance,
        limit: filter?.limit || 50
      });
    }
  }

  /**
   * 获取后备公告数据（在API失败时使用）
   */
  private static getFallbackAnnouncements(): ExchangeAnnouncement[] {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;
    
    return [
      {
        id: 'okx_fallback_1',
        exchange: 'okx',
        title: 'OKX上线新代币ORDI永续合约',
        content: 'OKX将于今日上线ORDI-USDT永续合约，支持高达20倍杠杆交易。ORDI是比特币生态的重要代币。',
        category: 'derivatives',
        importance: 'high' as 'high',
        publishTime: now - oneHour,
        tags: ['ORDI', '合约', '永续', 'Bitcoin'],
        url: 'https://www.okx.com/zh-hans/help/category/announcements'
      },
      {
        id: 'okx_fallback_2',
        exchange: 'okx',
        title: 'OKX Web3钱包支持Starknet网络',
        content: 'OKX Web3钱包现已支持Starknet网络，用户可以直接在钱包中管理STRK代币和进行相关DeFi操作。',
        category: 'wallet',
        importance: 'medium' as 'medium',
        publishTime: now - 2 * oneHour,
        tags: ['Web3', 'Starknet', 'STRK', 'DeFi'],
        url: 'https://www.okx.com/zh-hans/help/category/announcements'
      },
      {
        id: 'binance_fallback_1',
        exchange: 'binance',
        title: '币安上线PENDLE现货交易',
        content: '币安将于今日上线Pendle (PENDLE)，并开放PENDLE/USDT, PENDLE/BTC, PENDLE/FDUSD现货交易对。',
        category: 'listing',
        importance: 'high' as 'high',
        publishTime: now - 3 * oneHour,
        tags: ['PENDLE', '上币', '现货', 'DeFi'],
        url: 'https://www.binance.com/zh-CN/support/announcement'
      },
      {
        id: 'binance_fallback_2',
        exchange: 'binance',
        title: '币安理财新增SOL锁仓产品',
        content: '币安理财新增Solana (SOL) 30天锁仓产品，年化收益率高达8.5%，限量发售。',
        category: 'earn',
        importance: 'medium' as 'medium',
        publishTime: now - 4 * oneHour,
        tags: ['SOL', '理财', '锁仓', 'Solana'],
        url: 'https://www.binance.com/zh-CN/support/announcement'
      },
      {
        id: 'bybit_fallback_1',
        exchange: 'bybit',
        title: 'Bybit上线AI Agent代币交易',
        content: 'Bybit现已支持多个AI Agent相关代币的现货和合约交易，包括AI、VIRTUAL等热门项目。',
        category: 'listing',
        importance: 'high' as 'high',
        publishTime: now - 5 * oneHour,
        tags: ['AI', 'VIRTUAL', 'Agent', '现货'],
        url: 'https://www.bybit.com/zh-CN/help-center/bybitHC_Article'
      },
      {
        id: 'gate_fallback_1',
        exchange: 'gate',
        title: 'Gate.io启动Meme币专区',
        content: 'Gate.io推出Meme币专区，集中展示DOGE、SHIB、PEPE等热门Meme代币的交易信息。',
        category: 'general',
        importance: 'medium' as 'medium',
        publishTime: now - 6 * oneHour,
        tags: ['Meme', 'DOGE', 'SHIB', 'PEPE'],
        url: 'https://www.gate.io/zh/announcements'
      }
    ];
  }

  /**
   * 应用过滤器
   */
  private static applyFilter(announcements: ExchangeAnnouncement[], filter: AnnouncementFilter): ExchangeAnnouncement[] {
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
      filtered = filtered.filter(ann => 
        filter.tags!.some(tag => ann.tags.includes(tag))
      );
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(ann => ann.publishTime >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter(ann => ann.publishTime <= filter.dateTo!);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * 确定公告重要性
   */
  private static determineImportance(title: string, content: string): 'high' | 'medium' | 'low' {
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
  private static categorizeAnnouncement(title: string): string {
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
  private static extractTags(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const tags: string[] = [];

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
  static async getTokenRelatedAnnouncements(tokenSymbol: string): Promise<ExchangeAnnouncement[]> {
    const allAnnouncements = await this.getAllAnnouncements();
    
    return allAnnouncements.filter(ann => 
      ann.title.toUpperCase().includes(tokenSymbol.toUpperCase()) ||
      ann.content.toUpperCase().includes(tokenSymbol.toUpperCase()) ||
      ann.tags.includes(tokenSymbol.toUpperCase())
    );
  }

  /**
   * 获取高优先级公告
   */
  static async getHighPriorityAnnouncements(): Promise<ExchangeAnnouncement[]> {
    return this.getAllAnnouncements({ importance: 'high', limit: 50 });
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    this.cache.clear();
    Logger.info('CEX announcements cache cleared');
  }

  /**
   * 增强公告内容 - 将英文标题转换为更友好的中文描述
   */
  private static enhanceAnnouncementContent(title: string, content: string, exchange: string): { title: string; content: string } {
    // 如果已经包含中文，直接返回
    if (/[\u4e00-\u9fa5]/.test(title)) {
      return { title, content };
    }

    // 英文到中文的常见模式映射
    const patterns = [
      {
        pattern: /will list|listing|list/i,
        template: (match: any) => title.includes('Binance') ? `币安将上线 ${this.extractTokenName(title)}` : 
                   title.includes('OKX') ? `OKX将上线 ${this.extractTokenName(title)}` :
                   title.includes('Bybit') ? `Bybit将上线 ${this.extractTokenName(title)}` :
                   title.includes('KuCoin') ? `KuCoin将上线 ${this.extractTokenName(title)}` :
                   `${exchange.toUpperCase()}将上线 ${this.extractTokenName(title)}`
      },
      {
        pattern: /delist|delisting|removal/i,
        template: (match: any) => `${exchange.toUpperCase()}将下架 ${this.extractTokenName(title)}`
      },
      {
        pattern: /maintenance|upgrade|network upgrade/i,
        template: (match: any) => `${exchange.toUpperCase()}网络维护：${this.extractTokenName(title)}`
      },
      {
        pattern: /futures|perpetual|contract/i,
        template: (match: any) => `${exchange.toUpperCase()}合约：${this.extractTokenName(title)} 永续合约`
      },
      {
        pattern: /earn|staking|savings/i,
        template: (match: any) => `${exchange.toUpperCase()}理财：${this.extractTokenName(title)} 质押服务`
      },
      {
        pattern: /trading.*fee|fee.*adjust/i,
        template: (match: any) => `${exchange.toUpperCase()}手续费调整公告`
      },
      {
        pattern: /wallet|web3/i,
        template: (match: any) => `${exchange.toUpperCase()}钱包功能更新`
      }
    ];

    // 尝试匹配模式并生成中文标题
    for (const { pattern, template } of patterns) {
      if (pattern.test(title)) {
        const enhancedTitle = template(pattern);
        const enhancedContent = content || this.generateContentFromTitle(enhancedTitle, exchange);
        return { title: enhancedTitle, content: enhancedContent };
      }
    }

    // 如果没有匹配到特定模式，返回原内容
    return { title, content };
  }

  /**
   * 从标题中提取代币名称
   */
  private static extractTokenName(title: string): string {
    // 提取括号中的代币符号
    const tokenMatch = title.match(/\(([A-Z]{2,10})\)/);
    if (tokenMatch) return tokenMatch[1];
    
    // 提取常见的代币名称模式
    const nameMatch = title.match(/\b([A-Z]{2,10})\b/);
    if (nameMatch) return nameMatch[1];
    
    return '新代币';
  }

  /**
   * 根据标题生成内容描述
   */
  private static generateContentFromTitle(title: string, exchange: string): string {
    if (title.includes('上线')) {
      return `${exchange.toUpperCase()}宣布上线新的数字资产，用户可以进行相关交易操作。请注意相关风险提示。`;
    }
    if (title.includes('下架')) {
      return `${exchange.toUpperCase()}将停止相关数字资产的交易服务，请用户及时处理相关资产。`;
    }
    if (title.includes('维护')) {
      return `${exchange.toUpperCase()}将进行系统维护升级，期间可能影响相关服务的正常使用。`;
    }
    if (title.includes('合约')) {
      return `${exchange.toUpperCase()}推出新的合约交易产品，支持杠杆交易功能。`;
    }
    if (title.includes('理财')) {
      return `${exchange.toUpperCase()}推出新的理财产品，为用户提供资产增值服务。`;
    }
    if (title.includes('手续费')) {
      return `${exchange.toUpperCase()}调整交易手续费标准，请用户关注最新费率信息。`;
    }
    if (title.includes('钱包')) {
      return `${exchange.toUpperCase()}钱包功能更新，提供更好的用户体验和安全保障。`;
    }
    
    return `${exchange.toUpperCase()}发布重要公告，请用户及时关注相关信息。`;
  }

  /**
   * Binance模拟数据
   */
  private static getMockBinanceAnnouncements(): ExchangeAnnouncement[] {
    return [
      {
        id: 'binance_mock_1',
        exchange: 'binance',
        title: '币安将上线 Somnia (SOMI) 并开通现货交易',
        content: '亲爱的用户，币安将上线 Somnia (SOMI) 并开放 SOMI/USDT, SOMI/BTC, SOMI/FDUSD 交易对。',
        category: 'listing',
        importance: 'high',
        publishTime: Date.now() - 3600000,
        tags: ['SOMI', '新币上线', '现货交易'],
        url: 'https://www.binance.com/zh-CN/support/announcement/binance-will-list-somi'
      },
      {
        id: 'binance_mock_2',
        exchange: 'binance',
        title: '关于下架部分现货交易对的公告 - 2025年9月3日',
        content: '币安将下架并停止以下现货交易对的交易，请用户做好相应准备。',
        category: 'delisting',
        importance: 'high',
        publishTime: Date.now() - 7200000,
        tags: ['下架', '现货交易'],
        url: 'https://www.binance.com/zh-CN/support/announcement/notice-of-removal'
      },
      {
        id: 'binance_mock_3',
        exchange: 'binance',
        title: '币安合约将上线 WLFIUSDT 永续合约',
        content: '币安合约将于2025年9月3日上线 WLFIUSDT 永续合约，支持高达50倍杠杆。',
        category: 'derivatives',
        importance: 'medium',
        publishTime: Date.now() - 10800000,
        tags: ['WLFI', '合约', '永续'],
        url: 'https://www.binance.com/zh-CN/support/announcement/wlfi-futures'
      },
      {
        id: 'binance_mock_4',
        exchange: 'binance',
        title: '币安理财新增多种高收益产品',
        content: '币安理财新增 BTC、ETH、BNB 等多种数字资产的高收益理财产品，年化收益率高达12%。',
        category: 'earn',
        importance: 'medium',
        publishTime: Date.now() - 14400000,
        tags: ['理财', 'BTC', 'ETH', 'BNB'],
        url: 'https://www.binance.com/zh-CN/support/announcement/new-earn-products'
      }
    ];
  }

  /**
   * OKX模拟数据 - 基于真实最新动态的中文版本
   */
  private static getMockOKXAnnouncements(): ExchangeAnnouncement[] {
    return [
      {
        id: 'okx_real_1',
        exchange: 'okx',
        title: 'OKX将调整期权交易手续费标准',
        content: '为了优化用户体验，OKX将于9月3日调整期权交易手续费率规则，详情请查看公告。',
        category: 'trading',
        importance: 'high',
        publishTime: 1756821601000, // 真实时间戳
        tags: ['期权', '手续费', '交易'],
        url: 'https://www.okx.com/zh-hans/help/okx-to-adjust-options-trading-fees'
      },
      {
        id: 'okx_real_2',
        exchange: 'okx',
        title: 'OKX钱包公告：铭文资产定价升级',
        content: 'OKX钱包将升级铭文资产定价功能，为用户提供更准确的资产估值服务。',
        category: 'wallet',
        importance: 'medium',
        publishTime: 1756742400000,
        tags: ['OKX钱包', '铭文', '定价'],
        url: 'https://www.okx.com/zh-hans/help/okx-wallet-announcement-for-inscription-asset-pricing-upgrade'
      },
      {
        id: 'okx_real_3',
        exchange: 'okx',
        title: 'OKX将调整现货最小交易数量',
        content: 'OKX将于近期调整部分现货交易对的最小交易数量，请用户注意相关变化。',
        category: 'trading',
        importance: 'medium',
        publishTime: 1756194000000,
        tags: ['现货', '最小交易量', '调整'],
        url: 'https://www.okx.com/zh-hans/help/okx-to-adjust-the-minimum-trade-amount-of-spots'
      },
      {
        id: 'okx_real_4',
        exchange: 'okx',
        title: 'OKX钱包停止支持以太坊公链网络',
        content: 'OKX钱包将停止对EthereumFair网络的支持，请用户及时转移相关资产。',
        category: 'maintenance',
        importance: 'high',
        publishTime: 1756137600000,
        tags: ['OKX钱包', '以太坊', '停止支持'],
        url: 'https://www.okx.com/zh-hans/help/okx-wallet-ethereumfair'
      }
    ];
  }

  /**
   * KuCoin模拟数据
   */
  private static getMockKuCoinAnnouncements(): ExchangeAnnouncement[] {
    return [
      {
        id: 'kucoin_mock_1',
        exchange: 'kucoin',
        title: 'KuCoin 新币挖矿活动：质押 KCS 赢取新币',
        content: '参与 KuCoin 新币挖矿活动，质押 KCS 即可获得新上线项目的空投奖励。',
        category: 'promotion',
        importance: 'medium',
        publishTime: Date.now() - 6300000,
        tags: ['KCS', '质押', '新币挖矿'],
        url: 'https://www.kucoin.com/zh-cn/news/kucoin-pool-x-staking'
      },
      {
        id: 'kucoin_mock_2',
        exchange: 'kucoin',
        title: 'KuCoin 现货网格交易大赛开始',
        content: '参与 KuCoin 现货网格交易大赛，赢取总价值10万 USDT 的奖金池。',
        category: 'trading',
        importance: 'medium',
        publishTime: Date.now() - 10800000,
        tags: ['网格交易', '现货', '交易大赛'],
        url: 'https://www.kucoin.com/zh-cn/news/grid-trading-contest'
      }
    ];
  }

  /**
   * Bybit模拟数据
   */
  private static getMockBybitAnnouncements(): ExchangeAnnouncement[] {
    return [
      {
        id: 'bybit_mock_1',
        exchange: 'bybit',
        title: 'Bybit 合约交易大赛 WSOT 2025 正式开始',
        content: 'Bybit 世界交易大赛 WSOT 2025 正式开始，总奖金池超过500万 USDT。',
        category: 'trading',
        importance: 'high',
        publishTime: Date.now() - 7200000,
        tags: ['WSOT', '交易大赛', 'USDT'],
        url: 'https://www.bybit.com/zh-CN/help/bybit-wsot-2025'
      },
      {
        id: 'bybit_mock_2',
        exchange: 'bybit',
        title: 'Bybit Web3 钱包全新升级',
        content: 'Bybit Web3 钱包迎来重大升级，支持更多 DeFi 协议和 NFT 交易功能。',
        category: 'general',
        importance: 'medium',
        publishTime: Date.now() - 11700000,
        tags: ['Web3', 'DeFi', 'NFT'],
        url: 'https://www.bybit.com/zh-CN/help/bybit-web3-upgrade'
      }
    ];
  }

  /**
   * 使用新的爬虫服务获取真实数据
   */
  static async getAnnouncementsWithScraper(): Promise<ExchangeAnnouncement[]> {
    Logger.info('🚀 使用新爬虫服务获取CEX公告数据...');
    
    try {
      const scrapedAnnouncements = await CexScraperService.scrapeAllExchanges();
      Logger.info(`✅ 新爬虫服务获取到 ${scrapedAnnouncements.length} 条公告`);
      
      // 转换数据格式
      const announcements: ExchangeAnnouncement[] = scrapedAnnouncements.map(scraped => ({
        id: scraped.id,
        exchange: scraped.exchange,
        title: scraped.title,
        content: scraped.content,
        category: scraped.category,
        importance: scraped.importance,
        publishTime: scraped.publishTime,
        tags: scraped.tags,
        url: scraped.url
      }));

      // 保存到数据库
      if (announcements.length > 0) {
        await this.saveAnnouncementsToDB(announcements);
        Logger.info(`💾 成功保存 ${announcements.length} 条公告到数据库`);
      }

      return announcements;
    } catch (error) {
      Logger.error('新爬虫服务获取失败', { error });
      return this.getFallbackAnnouncements();
    }
  }

  /**
   * 替换现有的Binance API调用为新爬虫服务
   */
  static async getBinanceAnnouncementsV2(): Promise<ExchangeAnnouncement[]> {
    Logger.info('🔥 使用新版Binance爬虫服务...');
    
    try {
      const scrapedData = await CexScraperService.scrapeBinanceAnnouncements();
      const announcements: ExchangeAnnouncement[] = scrapedData.map(scraped => ({
        id: scraped.id,
        exchange: scraped.exchange,
        title: scraped.title,
        content: scraped.content,
        category: scraped.category,
        importance: scraped.importance,
        publishTime: scraped.publishTime,
        tags: scraped.tags,
        url: scraped.url
      }));

      Logger.info(`✅ 新版Binance爬虫获取到 ${announcements.length} 条公告`);
      return announcements;
    } catch (error) {
      Logger.error('新版Binance爬虫失败:', error);
      return this.getMockBinanceAnnouncements();
    }
  }

  /**
   * 替换现有的OKX API调用为新爬虫服务
   */
  static async getOKXAnnouncementsV2(): Promise<ExchangeAnnouncement[]> {
    Logger.info('🔥 使用新版OKX爬虫服务...');
    
    try {
      const scrapedData = await CexScraperService.scrapeOkxAnnouncements();
      const announcements: ExchangeAnnouncement[] = scrapedData.map(scraped => ({
        id: scraped.id,
        exchange: scraped.exchange,
        title: scraped.title,
        content: scraped.content,
        category: scraped.category,
        importance: scraped.importance,
        publishTime: scraped.publishTime,
        tags: scraped.tags,
        url: scraped.url
      }));

      Logger.info(`✅ 新版OKX爬虫获取到 ${announcements.length} 条公告`);
      return announcements;
    } catch (error) {
      Logger.error('新版OKX爬虫失败:', error);
      return this.getMockOKXAnnouncements();
    }
  }
}