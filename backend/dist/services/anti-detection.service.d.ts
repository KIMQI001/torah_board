import { AxiosRequestConfig, AxiosResponse } from 'axios';
export interface ProxyConfig {
    host: string;
    port: number;
    auth?: {
        username: string;
        password: string;
    };
}
export declare class AntiDetectionService {
    private static userAgents;
    private static acceptLanguages;
    private static viewportSizes;
    private static freeProxies;
    /**
     * 获取随机User-Agent
     */
    static getRandomUserAgent(): string;
    /**
     * 获取随机Accept-Language
     */
    static getRandomAcceptLanguage(): string;
    /**
     * 获取随机视口大小
     */
    static getRandomViewport(): {
        width: number;
        height: number;
    };
    /**
     * 生成高度拟真的浏览器请求头
     */
    static generateRealisticHeaders(referer?: string, exchange?: string): Record<string, string>;
    /**
     * 随机延迟，模拟人类行为
     */
    static humanDelay(minMs?: number, maxMs?: number): Promise<void>;
    /**
     * 获取可用代理
     */
    static getWorkingProxy(): Promise<ProxyConfig | null>;
    /**
     * 智能请求发送，包含反爬虫绕过逻辑
     */
    static makeSmartRequest(url: string, config?: AxiosRequestConfig, maxRetries?: number): Promise<AxiosResponse>;
    /**
     * 判断是否应该重试
     */
    private static shouldRetry;
    /**
     * 检测响应是否为反爬虫页面
     */
    static isAntiCrawlerResponse(data: any, response?: AxiosResponse): boolean;
    /**
     * 创建持久化会话
     */
    static createSession(): import("axios").AxiosInstance;
}
//# sourceMappingURL=anti-detection.service.d.ts.map