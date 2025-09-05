export interface ScraperConfig {
    request: {
        timeout: number;
        maxRetries: number;
        retryDelay: number;
        maxConcurrent: number;
        humanDelayMin: number;
        humanDelayMax: number;
    };
    antiDetection: {
        rotateUserAgent: boolean;
        rotateHeaders: boolean;
        useRandomDelay: boolean;
        enableProxy: boolean;
        enableSession: boolean;
        maxRequestsPerSession: number;
    };
    extraction: {
        maxAnnouncementsPerSource: number;
        minTitleLength: number;
        maxTitleLength: number;
        enableDeduplication: boolean;
        duplicateThreshold: number;
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
        cacheKey: string;
    };
    sources: {
        [exchange: string]: {
            enabled: boolean;
            priority: number;
            fallbackStrategies: string[];
        };
    };
}
export declare const DEFAULT_SCRAPER_CONFIG: ScraperConfig;
export declare class ScraperConfigManager {
    private static config;
    private static configListeners;
    /**
     * 获取当前配置
     */
    static getConfig(): ScraperConfig;
    /**
     * 更新配置
     */
    static updateConfig(newConfig: Partial<ScraperConfig>): void;
    /**
     * 重置为默认配置
     */
    static resetConfig(): void;
    /**
     * 添加配置变更监听器
     */
    static addConfigListener(listener: (config: ScraperConfig) => void): void;
    /**
     * 移除配置变更监听器
     */
    static removeConfigListener(listener: (config: ScraperConfig) => void): void;
    /**
     * 根据环境自动调整配置
     */
    static autoAdjustConfig(): void;
    /**
     * 获取指定交易所的配置
     */
    static getExchangeConfig(exchange: string): {
        enabled: boolean;
        priority: number;
        fallbackStrategies: string[];
    };
    /**
     * 获取启用的交易所列表（按优先级排序）
     */
    static getEnabledExchanges(): Array<{
        exchange: string;
        config: any;
    }>;
    /**
     * 动态调整请求频率
     */
    static adjustRequestFrequency(success: boolean, exchange: string): void;
    /**
     * 检查是否应该启用代理
     */
    static shouldUseProxy(): boolean;
    /**
     * 检查是否应该使用随机延迟
     */
    static shouldUseRandomDelay(): boolean;
    /**
     * 获取人为延迟范围
     */
    static getHumanDelayRange(): [number, number];
    /**
     * 私有方法：合并配置
     */
    private static mergeConfig;
    /**
     * 私有方法：通知监听器
     */
    private static notifyListeners;
}
export declare const PRESET_CONFIGS: {
    aggressive: {
        request: {
            timeout: number;
            maxRetries: number;
            retryDelay: number;
            maxConcurrent: number;
            humanDelayMin: number;
            humanDelayMax: number;
        };
        antiDetection: {
            rotateUserAgent: boolean;
            rotateHeaders: boolean;
            useRandomDelay: boolean;
            enableProxy: boolean;
            enableSession: boolean;
            maxRequestsPerSession: number;
        };
        cache: {
            enabled: boolean;
            ttl: number;
            maxSize: number;
            cacheKey: string;
        };
    };
    conservative: {
        request: {
            timeout: number;
            maxRetries: number;
            retryDelay: number;
            maxConcurrent: number;
            humanDelayMin: number;
            humanDelayMax: number;
        };
        antiDetection: {
            rotateUserAgent: boolean;
            rotateHeaders: boolean;
            useRandomDelay: boolean;
            enableProxy: boolean;
            enableSession: boolean;
            maxRequestsPerSession: number;
        };
        cache: {
            enabled: boolean;
            ttl: number;
            maxSize: number;
            cacheKey: string;
        };
    };
    balanced: ScraperConfig;
};
export declare const applyPresetConfig: (presetName: keyof typeof PRESET_CONFIGS) => void;
//# sourceMappingURL=scraper.config.d.ts.map