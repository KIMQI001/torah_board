/**
 * 统一配置管理
 * 根据环境变量自动选择配置
 */

// 获取当前环境
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// 获取当前主机地址（用于动态配置）
const getHost = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

// API配置
export const apiConfig = {
  // API基础URL
  baseUrl: (() => {
    // 优先使用环境变量
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // 开发环境中，如果通过IP访问但没有设置生产配置，仍使用localhost API
    if (typeof window !== 'undefined') {
      const host = getHost();
      // 如果是通过IP地址访问，但在开发环境，使用localhost的API
      if (isDevelopment && host !== 'localhost' && host !== '127.0.0.1') {
        console.log('🔗 IP访问检测到，但开发环境使用localhost API');
        return 'http://localhost:3002/api/v1';
      }
      return `http://${host}:3002/api/v1`;
    }
    return 'http://localhost:3002/api/v1';
  })(),
  
  // 旧版API地址（journal等服务使用）
  legacyBaseUrl: (() => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL;
    }
    if (typeof window !== 'undefined') {
      const host = getHost();
      // 开发环境中，如果通过IP访问但没有设置生产配置，仍使用localhost API
      if (isDevelopment && host !== 'localhost' && host !== '127.0.0.1') {
        console.log('🔗 IP访问检测到，但开发环境使用localhost API (legacy)');
        return 'http://localhost:3002';
      }
      return `http://${host}:3002`;
    }
    return 'http://localhost:3002';
  })(),
  
  // 请求超时时间（毫秒）
  timeout: 30000,
  
  // 重试次数
  retryCount: 3,
};

// WebSocket配置
export const wsConfig = {
  // WebSocket URL
  url: (() => {
    // 优先使用环境变量
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }
    // 开发环境自动使用当前主机
    if (typeof window !== 'undefined') {
      const host = getHost();
      return `ws://${host}:5002`;
    }
    return 'ws://localhost:5002';
  })(),
  
  // 是否启用WebSocket
  enabled: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
  
  // 重连配置
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
};

// Solana配置
export const solanaConfig = {
  // RPC节点地址
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  
  // 网络类型
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
  
  // 确认等级
  commitment: 'confirmed' as const,
};

// 功能开关
export const features = {
  // 是否启用WebSocket
  websocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
  
  // 是否启用开发者模式
  devMode: process.env.NEXT_PUBLIC_DEV_MODE === 'true',
  
  // 是否启用模拟数据
  mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  
  // 是否启用调试日志
  debugLog: isDevelopment || process.env.NEXT_PUBLIC_DEV_MODE === 'true',
};

// 应用配置
export const appConfig = {
  // 应用名称
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Web3 Dashboard',
  
  // 应用版本
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // 默认语言
  defaultLanguage: process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'zh',
  
  // 默认主题
  defaultTheme: process.env.NEXT_PUBLIC_DEFAULT_THEME || 'dark',
};

// 第三方服务配置
export const thirdPartyConfig = {
  // Google Analytics
  googleAnalytics: {
    id: process.env.NEXT_PUBLIC_GA_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_GA_ID,
  },
  
  // Sentry错误追踪
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
};

// 导出统一配置对象
export const config = {
  isDevelopment,
  isProduction,
  api: apiConfig,
  ws: wsConfig,
  solana: solanaConfig,
  features,
  app: appConfig,
  thirdParty: thirdPartyConfig,
};

// 调试函数 - 打印当前配置
export const printConfig = () => {
  if (features.debugLog) {
    console.log('========== Current Configuration ==========');
    console.log('Environment:', isDevelopment ? 'Development' : 'Production');
    console.log('API URL:', apiConfig.baseUrl);
    console.log('WebSocket URL:', wsConfig.url);
    console.log('WebSocket Enabled:', wsConfig.enabled);
    console.log('Solana Network:', solanaConfig.network);
    console.log('Features:', features);
    console.log('==========================================');
  }
};

// 在开发环境自动打印配置
if (isDevelopment && typeof window !== 'undefined') {
  printConfig();
}

export default config;