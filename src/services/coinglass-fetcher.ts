// Coinglass 4H涨跌榜数据获取服务

export interface CoinglassRankingItem {
  symbol: string;
  price: number;
  priceChange4h: number;
  priceChangePercent4h: number;
  volume24h: number;
  volumeChange4h?: number;
  marketCap: number;
  rank?: number;
  source: string;
  fetchedAt: string;
}

export interface CoinglassRankingData {
  gainers: CoinglassRankingItem[];
  losers: CoinglassRankingItem[];
  timestamp: number;
  source: string;
}

class CoinglassFetcher {
  private cache: {
    data: CoinglassRankingData | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0
  };

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
  
  // 可能的API端点列表（按优先级排序）
  private readonly API_ENDPOINTS = [
    'https://open-api.coinglass.com/api/spot/coins-markets',
    'https://api.coinglass.com/api/v4/spot/coins-markets',
    'https://www.coinglass.com/api/spot/coins-markets',
    'https://fapi.coinglass.com/api/spot/coins-markets'
  ];

  constructor() {
    // 初始化时不自动加载数据，等待手动调用
  }

  // 获取4H涨跌榜数据
  public async get4HRankings(): Promise<CoinglassRankingData> {
    const now = Date.now();
    
    console.log('🔄 正在获取Coinglass 4H涨跌榜数据...');
    
    // 检查缓存
    if (this.cache.data && now - this.cache.timestamp < this.CACHE_DURATION) {
      console.log('📦 使用缓存的Coinglass数据');
      return this.cache.data;
    }

    // 临时：直接返回备用数据进行测试
    console.log('⚠️ 临时使用备用数据（测试模式）');
    const fallbackData = this.getFallbackData();
    
    this.cache = {
      data: fallbackData,
      timestamp: now
    };
    
    console.log(`✅ 返回Coinglass测试数据: ${fallbackData.gainers.length}个上涨, ${fallbackData.losers.length}个下跌`);
    return fallbackData;
  }

  // 获取排行数据的主函数
  private async fetchRankingsData(): Promise<CoinglassRankingData> {
    console.log('🚀 开始获取Coinglass数据...');
    
    // 为了快速响应，设置整体超时
    const fetchPromise = this.attemptDataFetch();
    const timeoutPromise = new Promise<CoinglassRankingData>((_, reject) => {
      setTimeout(() => reject(new Error('整体获取超时')), 15000);
    });

    try {
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.log('⚠️ 所有获取方式都失败，返回备用数据');
      return this.getFallbackData();
    }
  }

  // 尝试获取数据的内部函数
  private async attemptDataFetch(): Promise<CoinglassRankingData> {
    // 方式1: 尝试内部API端点
    try {
      const apiData = await this.tryAPIEndpoints();
      if (apiData) {
        return apiData;
      }
    } catch (error) {
      console.log('🔄 API端点获取失败，尝试网页抓取...');
    }

    // 方式2: 网页抓取备用方案
    try {
      const webData = await this.scrapeWebPage();
      if (webData) {
        return webData;
      }
    } catch (error) {
      console.log('🔄 网页抓取失败，使用模拟数据...');
    }

    // 方式3: 返回备用数据
    return this.getFallbackData();
  }

  // 尝试调用各个可能的API端点
  private async tryAPIEndpoints(): Promise<CoinglassRankingData | null> {
    for (const endpoint of this.API_ENDPOINTS) {
      try {
        console.log(`🌐 尝试API端点: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://www.coinglass.com/',
            'Origin': 'https://www.coinglass.com'
          },
          signal: AbortSignal.timeout(5000) // 减少到5秒超时
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API端点 ${endpoint} 响应成功`);
          
          const parsedData = this.parseAPIResponse(data, endpoint);
          if (parsedData) {
            return parsedData;
          }
        }
        
      } catch (error) {
        console.log(`❌ API端点 ${endpoint} 失败:`, error.message);
        continue;
      }
    }
    
    return null;
  }

  // 解析API响应数据
  private parseAPIResponse(data: any, source: string): CoinglassRankingData | null {
    try {
      console.log('🔧 正在解析API响应数据...');
      
      // 处理不同的响应格式
      let coinList: any[] = [];
      
      if (data.code === 0 && data.data) {
        // 标准响应格式
        coinList = Array.isArray(data.data) ? data.data : [data.data];
      } else if (Array.isArray(data)) {
        // 直接数组格式
        coinList = data;
      } else if (data.result && Array.isArray(data.result)) {
        // result字段格式
        coinList = data.result;
      } else {
        console.log('⚠️ 无法识别的数据格式');
        return null;
      }

      const rankings: CoinglassRankingItem[] = [];
      const currentTime = new Date().toISOString();

      for (const coin of coinList) {
        // 尝试不同的字段名称组合
        const priceChange4h = coin.price_change_4h || coin.priceChange4h || coin.change_4h || 0;
        const priceChangePercent4h = coin.price_change_percent_4h || coin.priceChangePercent4h || coin.change_percent_4h || 0;
        
        if (coin.symbol && (coin.price || coin.last_price)) {
          rankings.push({
            symbol: coin.symbol.toUpperCase(),
            price: coin.price || coin.last_price || 0,
            priceChange4h: priceChange4h,
            priceChangePercent4h: priceChangePercent4h,
            volume24h: coin.volume_24h || coin.volume24h || coin.volume || 0,
            volumeChange4h: coin.volume_change_4h || coin.volumeChange4h || 0,
            marketCap: coin.market_cap || coin.marketCap || 0,
            source: `api-${source.split('/').pop()}`,
            fetchedAt: currentTime
          });
        }
      }

      if (rankings.length === 0) {
        console.log('⚠️ 解析后无有效数据');
        return null;
      }

      // 按4小时涨跌幅排序
      const sortedByChange = [...rankings].sort((a, b) => b.priceChangePercent4h - a.priceChangePercent4h);
      
      // 获取涨幅榜和跌幅榜
      const gainers = sortedByChange
        .filter(item => item.priceChangePercent4h > 0)
        .slice(0, 20)
        .map((item, index) => ({ ...item, rank: index + 1 }));
      
      const losers = sortedByChange
        .filter(item => item.priceChangePercent4h < 0)
        .slice(-20)
        .reverse()
        .map((item, index) => ({ ...item, rank: index + 1 }));

      console.log(`📊 解析成功: ${gainers.length}个涨幅币种, ${losers.length}个跌幅币种`);

      return {
        gainers,
        losers,
        timestamp: Date.now(),
        source: source
      };

    } catch (error) {
      console.error('❌ 解析API响应失败:', error);
      return null;
    }
  }

  // 网页抓取方案
  private async scrapeWebPage(): Promise<CoinglassRankingData | null> {
    try {
      console.log('🔍 正在抓取Coinglass网页数据...');
      
      const response = await fetch('https://www.coinglass.com/zh/gainers-losers', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`📄 获取页面HTML成功，大小: ${(html.length / 1024).toFixed(1)}KB`);

      // 尝试从HTML中提取数据
      const extractedData = await this.extractDataFromHTML(html);
      
      return extractedData;

    } catch (error) {
      console.error('🚫 网页抓取失败:', error);
      return null;
    }
  }

  // 从HTML中提取数据
  private async extractDataFromHTML(html: string): Promise<CoinglassRankingData | null> {
    try {
      console.log('🔧 正在从HTML中提取数据...');

      // 查找可能包含数据的JSON结构
      const jsonMatches = html.match(/__NEXT_DATA__\s*=\s*({.+?})/);
      // 注：删除了's'标志以兼容旧版本TypeScript
      if (jsonMatches) {
        const nextData = JSON.parse(jsonMatches[1]);
        console.log('🎯 找到__NEXT_DATA__');
        
        // 尝试提取数据
        const extractedData = this.extractFromNextData(nextData);
        if (extractedData) {
          return extractedData;
        }
      }

      // 查找其他可能的JSON数据结构
      const scriptMatches = html.match(/<script[^>]*>(.*?window\.__INITIAL_STATE__.*?)<\/script>/);
      if (scriptMatches) {
        console.log('🎯 找到INITIAL_STATE数据');
        // 进一步处理...
      }

      console.log('⚠️ 未能从HTML中提取到有效数据');
      return null;

    } catch (error) {
      console.error('❌ HTML数据提取失败:', error);
      return null;
    }
  }

  // 从Next.js数据中提取
  private extractFromNextData(nextData: any): CoinglassRankingData | null {
    try {
      // 尝试不同的数据路径
      const possiblePaths = [
        'props.pageProps.initialData',
        'props.pageProps.data',
        'props.initialProps.data',
        'query.data'
      ];

      for (const path of possiblePaths) {
        const data = this.getNestedValue(nextData, path);
        if (data && Array.isArray(data)) {
          console.log(`✅ 在路径 ${path} 找到数据`);
          return this.parseWebScrapedData(data);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Next.js数据解析失败:', error);
      return null;
    }
  }

  // 获取嵌套对象值
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // 解析网页抓取的数据
  private parseWebScrapedData(data: any[]): CoinglassRankingData {
    const rankings: CoinglassRankingItem[] = data.map(item => ({
      symbol: item.symbol || '',
      price: item.price || 0,
      priceChange4h: item.change_4h || 0,
      priceChangePercent4h: item.change_percent_4h || 0,
      volume24h: item.volume_24h || 0,
      marketCap: item.market_cap || 0,
      source: 'web-scraping',
      fetchedAt: new Date().toISOString()
    }));

    const sortedByChange = [...rankings].sort((a, b) => b.priceChangePercent4h - a.priceChangePercent4h);
    
    return {
      gainers: sortedByChange.filter(item => item.priceChangePercent4h > 0).slice(0, 20),
      losers: sortedByChange.filter(item => item.priceChangePercent4h < 0).slice(-20).reverse(),
      timestamp: Date.now(),
      source: 'web-scraping'
    };
  }

  // 备用数据
  private getFallbackData(): CoinglassRankingData {
    const currentTime = new Date().toISOString();
    
    return {
      gainers: [
        {
          symbol: 'DOGE',
          price: 0.08234,
          priceChange4h: 0.00567,
          priceChangePercent4h: 7.42,
          volume24h: 890000000,
          marketCap: 11800000000,
          rank: 1,
          source: 'fallback-data',
          fetchedAt: currentTime
        },
        {
          symbol: 'SHIB',
          price: 0.000012,
          priceChange4h: 0.0000008,
          priceChangePercent4h: 7.14,
          volume24h: 450000000,
          marketCap: 7200000000,
          rank: 2,
          source: 'fallback-data',
          fetchedAt: currentTime
        },
        {
          symbol: 'PEPE',
          price: 0.0000089,
          priceChange4h: 0.0000005,
          priceChangePercent4h: 5.95,
          volume24h: 320000000,
          marketCap: 3800000000,
          rank: 3,
          source: 'fallback-data',
          fetchedAt: currentTime
        }
      ],
      losers: [
        {
          symbol: 'LUNA',
          price: 0.45,
          priceChange4h: -0.087,
          priceChangePercent4h: -16.2,
          volume24h: 78000000,
          marketCap: 290000000,
          rank: 1,
          source: 'fallback-data',
          fetchedAt: currentTime
        },
        {
          symbol: 'FTT',
          price: 1.23,
          priceChange4h: -0.18,
          priceChangePercent4h: -12.8,
          volume24h: 45000000,
          marketCap: 890000000,
          rank: 2,
          source: 'fallback-data',
          fetchedAt: currentTime
        }
      ],
      timestamp: Date.now(),
      source: 'fallback-data'
    };
  }

  // 获取缓存信息
  public getCacheInfo() {
    return {
      hasData: !!this.cache.data,
      timestamp: this.cache.timestamp,
      cacheAge: Date.now() - this.cache.timestamp,
      isExpired: Date.now() - this.cache.timestamp > this.CACHE_DURATION
    };
  }

  // 清除缓存
  public clearCache() {
    this.cache = {
      data: null,
      timestamp: 0
    };
    console.log('🗑️ Coinglass缓存已清除');
  }
}

// 单例模式
export const coinglassFetcher = new CoinglassFetcher();