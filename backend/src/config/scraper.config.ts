export interface ScraperConfig {
  // 请求配置
  request: {
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    maxConcurrent: number;
    humanDelayMin: number;
    humanDelayMax: number;
  };

  // 反爬虫配置
  antiDetection: {
    rotateUserAgent: boolean;
    rotateHeaders: boolean;
    useRandomDelay: boolean;
    enableProxy: boolean;
    enableSession: boolean;
    maxRequestsPerSession: number;
  };

  // 数据提取配置
  extraction: {
    maxAnnouncementsPerSource: number;
    minTitleLength: number;
    maxTitleLength: number;
    enableDeduplication: boolean;
    duplicateThreshold: number; // 相似度阈值
  };

  // 缓存配置
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间 (秒)
    maxSize: number; // 最大缓存条目数
    cacheKey: string;
  };

  // 数据源优先级配置
  sources: {
    [exchange: string]: {
      enabled: boolean;
      priority: number;
      fallbackStrategies: string[];
    };
  };
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  request: {
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 2000,
    maxConcurrent: 5,
    humanDelayMin: 1000,
    humanDelayMax: 3000,
  },

  antiDetection: {
    rotateUserAgent: true,
    rotateHeaders: true,
    useRandomDelay: true,
    enableProxy: false, // 默认关闭代理
    enableSession: true,
    maxRequestsPerSession: 20,
  },

  extraction: {
    maxAnnouncementsPerSource: 20,
    minTitleLength: 5,
    maxTitleLength: 200,
    enableDeduplication: true,
    duplicateThreshold: 0.8, // 80%相似度算重复
  },

  cache: {
    enabled: true,
    ttl: 300, // 5分钟缓存
    maxSize: 1000,
    cacheKey: 'cex_announcements',
  },

  sources: {
    binance: {
      enabled: true,
      priority: 10,
      fallbackStrategies: ['api', 'web_scraping', 'rss', 'fallback_data'],
    },
    okx: {
      enabled: true,
      priority: 9,
      fallbackStrategies: ['api', 'web_scraping', 'fallback_data'],
    },
    bybit: {
      enabled: true,
      priority: 8,
      fallbackStrategies: ['api', 'fallback_data'],
    },
    huobi: {
      enabled: false,
      priority: 7,
      fallbackStrategies: ['api', 'fallback_data'],
    },
    kucoin: {
      enabled: false,
      priority: 6,
      fallbackStrategies: ['api', 'fallback_data'],
    },
  },
};

// 实时配置管理器
export class ScraperConfigManager {
  private static config: ScraperConfig = { ...DEFAULT_SCRAPER_CONFIG };
  private static configListeners: Array<(config: ScraperConfig) => void> = [];

  /**
   * 获取当前配置
   */
  public static getConfig(): ScraperConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public static updateConfig(newConfig: Partial<ScraperConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
    this.notifyListeners();
  }

  /**
   * 重置为默认配置
   */
  public static resetConfig(): void {
    this.config = { ...DEFAULT_SCRAPER_CONFIG };
    this.notifyListeners();
  }

  /**
   * 添加配置变更监听器
   */
  public static addConfigListener(listener: (config: ScraperConfig) => void): void {
    this.configListeners.push(listener);
  }

  /**
   * 移除配置变更监听器
   */
  public static removeConfigListener(listener: (config: ScraperConfig) => void): void {
    const index = this.configListeners.indexOf(listener);
    if (index > -1) {
      this.configListeners.splice(index, 1);
    }
  }

  /**
   * 根据环境自动调整配置
   */
  public static autoAdjustConfig(): void {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isDevelopment) {
      // 开发环境：更快的刷新，更详细的日志
      this.updateConfig({
        request: {
          ...this.config.request,
          maxRetries: 2,
          retryDelay: 1000,
        },
        cache: {
          ...this.config.cache,
          ttl: 60, // 1分钟缓存
        },
        antiDetection: {
          ...this.config.antiDetection,
          useRandomDelay: false, // 开发时减少延迟
        },
      });
    }

    if (isProduction) {
      // 生产环境：更保守的策略
      this.updateConfig({
        request: {
          ...this.config.request,
          maxRetries: 5,
          retryDelay: 3000,
        },
        cache: {
          ...this.config.cache,
          ttl: 600, // 10分钟缓存
        },
        antiDetection: {
          ...this.config.antiDetection,
          useRandomDelay: true,
          enableProxy: true, // 生产环境启用代理
        },
      });
    }
  }

  /**
   * 获取指定交易所的配置
   */
  public static getExchangeConfig(exchange: string) {
    return this.config.sources[exchange] || {
      enabled: false,
      priority: 1,
      fallbackStrategies: ['fallback_data'],
    };
  }

  /**
   * 获取启用的交易所列表（按优先级排序）
   */
  public static getEnabledExchanges(): Array<{ exchange: string; config: any }> {
    return Object.entries(this.config.sources)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => b.priority - a.priority)
      .map(([exchange, config]) => ({ exchange, config }));
  }

  /**
   * 动态调整请求频率
   */
  public static adjustRequestFrequency(success: boolean, exchange: string): void {
    const currentConfig = this.getExchangeConfig(exchange);
    
    if (!success) {
      // 失败时降低优先级，增加延迟
      this.updateConfig({
        request: {
          ...this.config.request,
          retryDelay: Math.min(this.config.request.retryDelay * 1.5, 10000),
          humanDelayMax: Math.min(this.config.request.humanDelayMax * 1.2, 8000),
        },
      });
    } else if (currentConfig.priority < 10) {
      // 成功时适当提高优先级
      const newSources = { ...this.config.sources };
      if (newSources[exchange]) {
        newSources[exchange].priority = Math.min(currentConfig.priority + 1, 10);
      }
      
      this.updateConfig({
        sources: newSources,
      });
    }
  }

  /**
   * 检查是否应该启用代理
   */
  public static shouldUseProxy(): boolean {
    return this.config.antiDetection.enableProxy;
  }

  /**
   * 检查是否应该使用随机延迟
   */
  public static shouldUseRandomDelay(): boolean {
    return this.config.antiDetection.useRandomDelay;
  }

  /**
   * 获取人为延迟范围
   */
  public static getHumanDelayRange(): [number, number] {
    return [this.config.request.humanDelayMin, this.config.request.humanDelayMax];
  }

  /**
   * 私有方法：合并配置
   */
  private static mergeConfig(base: ScraperConfig, update: Partial<ScraperConfig>): ScraperConfig {
    const merged = { ...base };
    
    Object.keys(update).forEach(key => {
      const updateValue = (update as any)[key];
      if (updateValue && typeof updateValue === 'object' && !Array.isArray(updateValue)) {
        (merged as any)[key] = { ...(merged as any)[key], ...updateValue };
      } else {
        (merged as any)[key] = updateValue;
      }
    });
    
    return merged;
  }

  /**
   * 私有方法：通知监听器
   */
  private static notifyListeners(): void {
    this.configListeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('配置监听器执行失败:', error);
      }
    });
  }
}

// 预设配置模板
export const PRESET_CONFIGS = {
  // 激进模式：快速获取数据，可能更容易被检测
  aggressive: {
    request: {
      timeout: 15000,
      maxRetries: 2,
      retryDelay: 500,
      maxConcurrent: 10,
      humanDelayMin: 100,
      humanDelayMax: 500,
    },
    antiDetection: {
      rotateUserAgent: true,
      rotateHeaders: true,
      useRandomDelay: false,
      enableProxy: false,
      enableSession: false,
      maxRequestsPerSession: 50,
    },
    cache: {
      enabled: true,
      ttl: 60,
      maxSize: 500,
      cacheKey: 'cex_announcements_aggressive',
    },
  },

  // 保守模式：更谨慎的抓取策略
  conservative: {
    request: {
      timeout: 60000,
      maxRetries: 5,
      retryDelay: 5000,
      maxConcurrent: 2,
      humanDelayMin: 3000,
      humanDelayMax: 8000,
    },
    antiDetection: {
      rotateUserAgent: true,
      rotateHeaders: true,
      useRandomDelay: true,
      enableProxy: true,
      enableSession: true,
      maxRequestsPerSession: 10,
    },
    cache: {
      enabled: true,
      ttl: 900, // 15分钟缓存
      maxSize: 2000,
      cacheKey: 'cex_announcements_conservative',
    },
  },

  // 平衡模式：默认配置的变体
  balanced: DEFAULT_SCRAPER_CONFIG,
};

// 导出便捷方法
export const applyPresetConfig = (presetName: keyof typeof PRESET_CONFIGS): void => {
  const preset = PRESET_CONFIGS[presetName];
  ScraperConfigManager.updateConfig(preset);
};

// 初始化时自动调整配置
ScraperConfigManager.autoAdjustConfig();