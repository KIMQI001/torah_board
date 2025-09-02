interface OdailyNewsItem {
  id: string;
  title: string;
  content: string;
  time: string;
  link?: string;
  tags?: string[];
  isAI?: boolean;
}

export class OdailyNewsService {
  private static instance: OdailyNewsService;
  private baseUrl = 'https://www.odaily.news/zh-CN/newsflash';
  private cache: Map<string, { data: OdailyNewsItem[], timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1分钟缓存

  static getInstance(): OdailyNewsService {
    if (!OdailyNewsService.instance) {
      OdailyNewsService.instance = new OdailyNewsService();
    }
    return OdailyNewsService.instance;
  }

  async fetchNewsFlash(): Promise<OdailyNewsItem[]> {
    const cacheKey = 'newsflash';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // 这里使用代理API或者后端服务来获取数据
      const response = await fetch('/api/odaily-news', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Odaily news');
      }

      const data = await response.json();
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data: data.items,
        timestamp: Date.now()
      });

      return data.items;
    } catch (error) {
      console.error('Error fetching Odaily news:', error);
      // 返回缓存数据或空数组
      return cached?.data || [];
    }
  }

  // 模拟数据用于开发
  getMockData(): OdailyNewsItem[] {
    return [
      {
        id: '1',
        title: 'BTC突破110000 USDT，24H涨幅2.22%',
        content: 'OKX行情显示，BTC突破110000 USDT，现报110029.9 USDT，24H涨幅2.22%',
        time: '02:58',
        isAI: true,
        tags: ['BTC', '价格']
      },
      {
        id: '2',
        title: 'BitMart"BM发现"专区上线holo (HOLO)',
        content: 'BitMart"BM发现"专区将于9月2日11:00（东八区时间）上线holo (HOLO)，开通HOLO/USDT交易对',
        time: '02:58',
        link: 'https://www.bitmart.com/zh-CN/trade?symbol=HOLO_USDT&type=spot',
        tags: ['新币', 'BitMart']
      },
      {
        id: '3',
        title: 'Aave 24小时费用收入近300万美元',
        content: 'DefiLlama数据显示，Aave过去24小时费用收入近300万美元，超其他借贷协议总和',
        time: '02:57',
        link: 'https://defillama.com/protocols/lending',
        tags: ['DeFi', 'Aave']
      },
      {
        id: '4',
        title: '加密KOL：前Aptos中文大使在华抢注商标',
        content: 'Aptos前中文大使被解约后，注册了Aptos及其Logo在中国的商品与品牌，并干扰Aptos支持的中文社区活动',
        time: '02:55',
        link: 'https://x.com/cryptobraveHQ/status/1962690050363375845',
        tags: ['Aptos', '社区']
      },
      {
        id: '5',
        title: 'pump.fun已回购超流通供应量5%的PUMP代币',
        content: '已投入373476 SOL用于PUMP回购，回购总额约67574919美元，抵消流通供应量的5.064%',
        time: '02:34',
        link: 'https://fees.pump.fun/',
        tags: ['pump.fun', '回购']
      }
    ];
  }

  // 格式化为NewsCard组件需要的格式
  formatForNewsCard(items: OdailyNewsItem[]): any[] {
    return items.map((item, index) => ({
      id: `odaily-${item.id || index}`,
      title: item.title,
      content: item.content,
      summary: item.content.substring(0, 100),
      source: 'social' as const,
      sourceUrl: item.link,
      category: 'news',
      importance: this.getImportance(item),
      symbols: this.extractSymbols(item.content),
      tags: item.tags || [],
      metadata: {
        isAI: item.isAI,
        originalTime: item.time
      },
      isHot: index < 3, // 前3条标记为热门
      isVerified: true,
      publishTime: this.convertTimeToISO(item.time),
      createdAt: new Date().toISOString()
    }));
  }

  private getImportance(item: OdailyNewsItem): 'high' | 'medium' | 'low' {
    // 根据关键词判断重要性
    const highKeywords = ['突破', '暴涨', '暴跌', '黑客', '攻击', '重大'];
    const mediumKeywords = ['上线', '合作', '更新', '发布'];
    
    const content = item.title + item.content;
    
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => content.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private extractSymbols(content: string): string[] {
    const symbols: string[] = [];
    // 匹配常见的加密货币符号
    const matches = content.match(/\b[A-Z]{2,6}\b/g);
    if (matches) {
      const commonSymbols = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC'];
      matches.forEach(match => {
        if (commonSymbols.includes(match) && !symbols.includes(match)) {
          symbols.push(match);
        }
      });
    }
    return symbols;
  }

  private convertTimeToISO(timeStr: string): string {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const date = new Date(now);
    date.setHours(hours, minutes, 0, 0);
    
    // 如果时间在未来，说明是昨天的
    if (date > now) {
      date.setDate(date.getDate() - 1);
    }
    
    return date.toISOString();
  }
}

export default OdailyNewsService.getInstance();