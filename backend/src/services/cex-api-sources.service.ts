import { Logger } from '@/utils/logger';
import { AntiDetectionService } from './anti-detection.service';
import { ScrapedAnnouncement } from './cex-scraper.service';

export interface ApiEndpoint {
  name: string;
  url: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  parser: (data: any) => ScrapedAnnouncement[];
  priority: number; // 优先级，数字越大优先级越高
}

export class CexApiSourcesService {
  
  /**
   * Binance API数据源配置
   */
  private static readonly BINANCE_SOURCES: ApiEndpoint[] = [
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
      parser: (data: any) => CexApiSourcesService.parseBinanceCmsResponse(data),
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
      parser: (data: any) => CexApiSourcesService.parseBinanceSupportResponse(data),
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
      parser: (data: any) => CexApiSourcesService.parseBinanceNewsResponse(data),
    },
    // RSS Feed作为备选方案
    {
      name: 'binance-rss',
      url: 'https://www.binance.com/zh-CN/support/rss/48',
      priority: 4,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      parser: (data: any) => CexApiSourcesService.parseBinanceRssResponse(data),
    },
  ];

  /**
   * OKX API数据源配置
   */
  private static readonly OKX_SOURCES: ApiEndpoint[] = [
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
      parser: (data: any) => CexApiSourcesService.parseOkxSupportResponse(data),
    },
    {
      name: 'okx-help-api',
      url: 'https://www.okx.com/v3/c2c/support/homepage/announcements',
      priority: 8,
      params: {
        locale: 'zh-Hans',
        t: Date.now(),
      },
      parser: (data: any) => CexApiSourcesService.parseOkxHelpResponse(data),
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
      parser: (data: any) => CexApiSourcesService.parseOkxNewsResponse(data),
    },
  ];

  /**
   * 其他交易所数据源
   */
  private static readonly OTHER_SOURCES: ApiEndpoint[] = [
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
      parser: (data: any) => CexApiSourcesService.parseBybitResponse(data),
    },
    // Huobi/HTX
    {
      name: 'htx-announcements',
      url: 'https://www.htx.com/support/zh-cn/hc/zh-cn/sections/announcements/articles',
      priority: 5,
      parser: (data: any) => CexApiSourcesService.parseHtxResponse(data),
    },
  ];

  /**
   * 获取Binance公告数据
   */
  public static async fetchBinanceAnnouncements(): Promise<ScrapedAnnouncement[]> {
    Logger.info('🚀 开始从多个API源获取Binance公告...');

    // 按优先级排序
    const sources = [...this.BINANCE_SOURCES].sort((a, b) => b.priority - a.priority);
    
    for (const source of sources) {
      try {
        Logger.info(`🔍 尝试数据源: ${source.name} (优先级: ${source.priority})`);
        
        const response = await AntiDetectionService.makeSmartRequest(source.url, {
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
            Logger.info(`✅ ${source.name} 成功获取 ${announcements.length} 条公告`);
            return announcements;
          } else {
            Logger.warn(`⚠️ ${source.name} 返回空数据`);
          }
        }
        
      } catch (error: any) {
        Logger.error(`❌ ${source.name} 失败:`, error.message);
        continue;
      }
    }

    Logger.warn('所有Binance API源都失败，返回空数组');
    return [];
  }

  /**
   * 获取OKX公告数据
   */
  public static async fetchOkxAnnouncements(): Promise<ScrapedAnnouncement[]> {
    Logger.info('🚀 开始从多个API源获取OKX公告...');

    const sources = [...this.OKX_SOURCES].sort((a, b) => b.priority - a.priority);
    
    for (const source of sources) {
      try {
        Logger.info(`🔍 尝试数据源: ${source.name} (优先级: ${source.priority})`);
        
        const response = await AntiDetectionService.makeSmartRequest(source.url, {
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
            Logger.info(`✅ ${source.name} 成功获取 ${announcements.length} 条公告`);
            return announcements;
          } else {
            Logger.warn(`⚠️ ${source.name} 返回空数据`);
          }
        }
        
      } catch (error: any) {
        Logger.error(`❌ ${source.name} 失败:`, error.message);
        continue;
      }
    }

    Logger.warn('所有OKX API源都失败，返回空数组');
    return [];
  }

  /**
   * 获取其他交易所公告数据
   */
  public static async fetchOtherExchangeAnnouncements(): Promise<ScrapedAnnouncement[]> {
    Logger.info('🚀 开始获取其他交易所公告...');

    const results = await Promise.allSettled(
      this.OTHER_SOURCES.map(async (source) => {
        try {
          const response = await AntiDetectionService.makeSmartRequest(source.url, {
            params: source.params,
            headers: source.headers,
          });

          return source.parser(response.data);
        } catch (error) {
          Logger.error(`${source.name} 获取失败:`, error);
          return [];
        }
      })
    );

    const allAnnouncements: ScrapedAnnouncement[] = [];
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
  private static parseBinanceCmsResponse(data: any): ScrapedAnnouncement[] {
    try {
      const articles = data?.data?.articles || data?.articles || [];
      
      return articles.map((article: any, index: number) => ({
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
    } catch (error) {
      Logger.error('解析Binance CMS响应失败:', error);
      return [];
    }
  }

  /**
   * 解析Binance Support API响应
   */
  private static parseBinanceSupportResponse(data: any): ScrapedAnnouncement[] {
    try {
      const catalogDetail = data?.data?.catalogDetail;
      const articles = catalogDetail?.articles || catalogDetail?.list || [];
      
      return articles.map((article: any, index: number) => ({
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
    } catch (error) {
      Logger.error('解析Binance Support响应失败:', error);
      return [];
    }
  }

  /**
   * 解析Binance News API响应
   */
  private static parseBinanceNewsResponse(data: any): ScrapedAnnouncement[] {
    try {
      const articles = data?.data || data?.list || [];
      
      return articles.map((article: any, index: number) => ({
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
    } catch (error) {
      Logger.error('解析Binance News响应失败:', error);
      return [];
    }
  }

  /**
   * 解析Binance RSS响应
   */
  private static parseBinanceRssResponse(data: string): ScrapedAnnouncement[] {
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
    } catch (error) {
      Logger.error('解析Binance RSS响应失败:', error);
      return [];
    }
  }

  /**
   * 解析OKX Support API响应
   */
  private static parseOkxSupportResponse(data: any): ScrapedAnnouncement[] {
    try {
      const announcements = data?.data || data?.list || [];
      
      return announcements.map((item: any, index: number) => ({
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
    } catch (error) {
      Logger.error('解析OKX Support响应失败:', error);
      return [];
    }
  }

  /**
   * 解析OKX Help API响应
   */
  private static parseOkxHelpResponse(data: any): ScrapedAnnouncement[] {
    try {
      const announcements = data?.data?.announcements || data?.announcements || [];
      
      return announcements.map((item: any, index: number) => ({
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
    } catch (error) {
      Logger.error('解析OKX Help响应失败:', error);
      return [];
    }
  }

  /**
   * 解析OKX News API响应
   */
  private static parseOkxNewsResponse(data: any): ScrapedAnnouncement[] {
    try {
      const news = data?.data?.news || data?.news || [];
      
      return news.map((item: any, index: number) => ({
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
    } catch (error) {
      Logger.error('解析OKX News响应失败:', error);
      return [];
    }
  }

  /**
   * 解析Bybit响应
   */
  private static parseBybitResponse(data: any): ScrapedAnnouncement[] {
    try {
      const articles = data?.result?.list || data?.list || [];
      
      return articles.map((article: any, index: number) => ({
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
    } catch (error) {
      Logger.error('解析Bybit响应失败:', error);
      return [];
    }
  }

  /**
   * 解析HTX响应
   */
  private static parseHtxResponse(data: any): ScrapedAnnouncement[] {
    // HTX的解析逻辑需要根据实际API响应格式来实现
    return [];
  }

  /**
   * 通用分类映射
   */
  private static mapGeneralCategory(category: string): string {
    if (!category) return 'general';
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('listing') || lowerCategory.includes('上线')) return 'new-listings';
    if (lowerCategory.includes('delisting') || lowerCategory.includes('下架')) return 'delisting';
    if (lowerCategory.includes('futures') || lowerCategory.includes('合约')) return 'derivatives';
    if (lowerCategory.includes('maintenance') || lowerCategory.includes('维护')) return 'maintenance';
    if (lowerCategory.includes('api')) return 'api-updates';
    
    return 'general';
  }

  /**
   * Binance分类映射
   */
  private static mapBinanceCategory(categoryName: string): string {
    if (!categoryName) return 'general';
    const lowerName = categoryName.toLowerCase();
    
    if (lowerName.includes('新币') || lowerName.includes('上线') || lowerName.includes('listing')) return 'new-listings';
    if (lowerName.includes('合约') || lowerName.includes('futures')) return 'derivatives';
    if (lowerName.includes('api')) return 'api-updates';
    if (lowerName.includes('维护') || lowerName.includes('maintenance')) return 'maintenance';
    
    return 'general';
  }

  /**
   * OKX分类映射
   */
  private static mapOkxCategory(category: string): string {
    return this.mapGeneralCategory(category);
  }

  /**
   * 判断Binance重要性
   */
  private static determineBinanceImportance(title: string): 'high' | 'medium' | 'low' {
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
  private static determineOkxImportance(title: string): 'high' | 'medium' | 'low' {
    return this.determineBinanceImportance(title);
  }

  /**
   * 判断通用重要性
   */
  private static determineGeneralImportance(title: string): 'high' | 'medium' | 'low' {
    return this.determineBinanceImportance(title);
  }

  /**
   * 提取代币标签
   */
  private static extractTokenTags(title: string): string[] {
    const tags: string[] = [];
    
    // 匹配代币符号 (3-8个大写字母)
    const tokenMatches = title.match(/\b[A-Z]{3,8}\b/g);
    if (tokenMatches) {
      // 常见的代币过滤
      const commonTokens = tokenMatches.filter(token => 
        !['USD', 'CNY', 'EUR', 'GBP', 'API', 'NEW'].includes(token)
      );
      tags.push(...commonTokens);
    }
    
    // 添加功能标签
    if (title.includes('上线') || title.toLowerCase().includes('listing')) tags.push('新币上线');
    if (title.includes('合约') || title.toLowerCase().includes('futures')) tags.push('合约');
    if (title.includes('现货') || title.toLowerCase().includes('spot')) tags.push('现货');
    if (title.includes('维护') || title.toLowerCase().includes('maintenance')) tags.push('维护');
    
    return tags.length > 0 ? [...new Set(tags)] : ['公告'];
  }
}