import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '@/utils/logger';

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

export class AntiDetectionService {
  private static userAgents: string[] = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    
    // Chrome on Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    
    // Firefox
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
    
    // Safari
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    
    // Edge
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ];

  private static acceptLanguages: string[] = [
    'zh-CN,zh;q=0.9,en;q=0.8',
    'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'zh-TW,zh;q=0.9,en;q=0.8',
    'en-GB,en;q=0.9,zh-CN;q=0.8',
  ];

  private static viewportSizes: Array<{width: number; height: number}> = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ];

  // 免费代理池（实际使用时应该使用付费代理服务）
  private static freeProxies: ProxyConfig[] = [
    // 这里可以配置免费代理，但建议使用付费代理服务
    // { host: '47.74.152.29', port: 8888 },
    // { host: '139.196.214.238', port: 8080 },
  ];

  /**
   * 获取随机User-Agent
   */
  public static getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * 获取随机Accept-Language
   */
  public static getRandomAcceptLanguage(): string {
    return this.acceptLanguages[Math.floor(Math.random() * this.acceptLanguages.length)];
  }

  /**
   * 获取随机视口大小
   */
  public static getRandomViewport(): {width: number; height: number} {
    return this.viewportSizes[Math.floor(Math.random() * this.viewportSizes.length)];
  }

  /**
   * 生成高度拟真的浏览器请求头
   */
  public static generateRealisticHeaders(referer?: string, exchange?: string): Record<string, string> {
    const userAgent = this.getRandomUserAgent();
    const acceptLanguage = this.getRandomAcceptLanguage();
    const viewport = this.getRandomViewport();
    
    // 根据User-Agent确定浏览器类型
    const isChrome = userAgent.includes('Chrome');
    const isFirefox = userAgent.includes('Firefox');
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    
    const baseHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': acceptLanguage,
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': Math.random() > 0.5 ? 'max-age=0' : 'no-cache',
      'DNT': Math.random() > 0.7 ? '1' : undefined,
    };

    // Chrome特有头部
    if (isChrome) {
      baseHeaders['Sec-Fetch-Dest'] = 'document';
      baseHeaders['Sec-Fetch-Mode'] = 'navigate';
      baseHeaders['Sec-Fetch-Site'] = referer ? 'same-origin' : 'none';
      baseHeaders['Sec-Fetch-User'] = '?1';
      baseHeaders['Sec-CH-UA'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
      baseHeaders['Sec-CH-UA-Mobile'] = '?0';
      baseHeaders['Sec-CH-UA-Platform'] = userAgent.includes('Windows') ? '"Windows"' : '"macOS"';
      baseHeaders['Sec-CH-Viewport-Width'] = viewport.width.toString();
      baseHeaders['Sec-CH-Viewport-Height'] = viewport.height.toString();
    }

    // 根据交易所添加特定头部
    if (exchange === 'binance' && referer) {
      baseHeaders['Referer'] = referer;
      baseHeaders['Origin'] = 'https://www.binance.com';
      baseHeaders['Host'] = 'www.binance.com';
      baseHeaders['X-Requested-With'] = Math.random() > 0.5 ? 'XMLHttpRequest' : undefined;
    } else if (exchange === 'okx' && referer) {
      baseHeaders['Referer'] = referer;
      baseHeaders['Origin'] = 'https://www.okx.com';
      baseHeaders['Host'] = 'www.okx.com';
    }

    // 清除undefined值
    Object.keys(baseHeaders).forEach(key => {
      if (baseHeaders[key] === undefined) {
        delete baseHeaders[key];
      }
    });

    return baseHeaders;
  }

  /**
   * 随机延迟，模拟人类行为
   */
  public static async humanDelay(minMs = 1000, maxMs = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 获取可用代理
   */
  public static async getWorkingProxy(): Promise<ProxyConfig | null> {
    // 在实际应用中，这里应该实现代理池管理逻辑
    // 可以集成付费代理服务，如BrightData、ProxyMesh等
    return null; // 暂时不使用代理
  }

  /**
   * 智能请求发送，包含反爬虫绕过逻辑
   */
  public static async makeSmartRequest(
    url: string,
    config: AxiosRequestConfig = {},
    maxRetries = 3
  ): Promise<AxiosResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        Logger.info(`🤖 智能请求 (尝试 ${attempt}/${maxRetries}): ${url}`);

        // 添加随机延迟，避免请求过于频繁
        if (attempt > 1) {
          await this.humanDelay(2000, 5000);
        }

        // 生成随机化的请求头
        const headers = this.generateRealisticHeaders(config.headers?.['Referer'], config.meta?.exchange);
        
        // 获取代理配置
        const proxy = await this.getWorkingProxy();

        // 构建请求配置
        const requestConfig: AxiosRequestConfig = {
          method: 'GET',
          url,
          timeout: 30000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
          headers: {
            ...headers,
            ...config.headers,
          },
          ...config,
        };

        // 添加代理配置
        if (proxy) {
          requestConfig.proxy = {
            protocol: 'http',
            host: proxy.host,
            port: proxy.port,
            auth: proxy.auth,
          };
          Logger.info(`🔄 使用代理: ${proxy.host}:${proxy.port}`);
        }

        // 发送请求
        const response = await axios(requestConfig);

        // 检查响应状态
        if (response.status === 200) {
          Logger.info(`✅ 请求成功: ${url} (${response.status})`);
          return response;
        } else if (response.status === 202) {
          // 202通常是反爬虫机制，需要等待更长时间
          Logger.warn(`⏳ 检测到反爬虫(202)，延长等待时间: ${url}`);
          await this.humanDelay(5000, 10000);
          throw new Error(`HTTP 202: Anti-bot detection`);
        } else if (response.status === 403) {
          Logger.warn(`🔒 访问被拒绝(403): ${url}`);
          throw new Error(`HTTP 403: Forbidden`);
        } else if (response.status === 429) {
          // 请求过于频繁，需要更长的延迟
          const retryAfter = response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          Logger.warn(`⏰ 请求频率限制(429)，等待 ${waitTime}ms: ${url}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          throw new Error(`HTTP 429: Too Many Requests`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error: any) {
        lastError = error;
        
        Logger.error(`❌ 请求失败 (尝试 ${attempt}/${maxRetries}): ${url}`, {
          error: error.message,
          status: error.response?.status,
        });

        // 根据错误类型决定是否重试
        if (this.shouldRetry(error, attempt, maxRetries)) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * 判断是否应该重试
   */
  private static shouldRetry(error: any, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false;

    const status = error.response?.status;
    
    // 服务器错误或网络错误可以重试
    if (!status || status >= 500) return true;
    
    // 反爬虫检测相关状态码可以重试
    if ([202, 429].includes(status)) return true;
    
    // 客户端错误通常不重试
    if (status >= 400 && status < 500) return false;
    
    return true;
  }

  /**
   * 检测响应是否为反爬虫页面
   */
  public static isAntiCrawlerResponse(data: any, response?: AxiosResponse): boolean {
    if (!data) return false;

    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const lowercaseContent = content.toLowerCase();

    // 检查常见的反爬虫关键词
    const antiCrawlerKeywords = [
      'cloudflare',
      'please enable javascript',
      'please enable cookies',
      'blocked',
      'access denied',
      'robot',
      'captcha',
      'verification',
      'security check',
      'ray id',
      'ddos protection',
    ];

    const hasAntiCrawlerKeywords = antiCrawlerKeywords.some(keyword => 
      lowercaseContent.includes(keyword)
    );

    // 检查状态码
    const suspiciousStatusCodes = [202, 403, 429, 503];
    const hasSuspiciousStatus = response && suspiciousStatusCodes.includes(response.status);

    // 检查响应大小（反爬虫页面通常很小）
    const isTooSmall = content.length < 1000 && !content.includes('{') && !content.includes('[');

    return hasAntiCrawlerKeywords || hasSuspiciousStatus || isTooSmall;
  }

  /**
   * 创建持久化会话
   */
  public static createSession() {
    const session = axios.create({
      timeout: 30000,
      maxRedirects: 5,
    });

    // 添加请求拦截器
    session.interceptors.request.use((config) => {
      // 为每个请求添加随机化头部
      const randomHeaders = this.generateRealisticHeaders(
        config.headers?.['Referer'], 
        config.meta?.exchange
      );
      
      config.headers = {
        ...randomHeaders,
        ...config.headers,
      };

      return config;
    });

    // 添加响应拦截器
    session.interceptors.response.use(
      (response) => {
        // 检查是否为反爬虫响应
        if (this.isAntiCrawlerResponse(response.data, response)) {
          Logger.warn(`🚫 检测到反爬虫响应: ${response.config.url}`);
          return Promise.reject(new Error('Anti-crawler detected'));
        }
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return session;
  }
}