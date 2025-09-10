import { NextResponse } from 'next/server';
import { config } from '@/config';

/**
 * 配置状态API
 * 访问 /api/config 查看当前配置（开发环境）
 */
export async function GET() {
  // 仅在开发环境或开启了DEV_MODE时返回配置
  if (!config.isDevelopment && !config.features.devMode) {
    return NextResponse.json(
      { error: 'Configuration endpoint is disabled in production' },
      { status: 403 }
    );
  }

  // 返回安全的配置信息（移除敏感信息）
  const safeConfig = {
    environment: config.isDevelopment ? 'development' : 'production',
    api: {
      baseUrl: config.api.baseUrl,
      legacyBaseUrl: config.api.legacyBaseUrl,
      timeout: config.api.timeout,
    },
    websocket: {
      url: config.ws.url,
      enabled: config.ws.enabled,
      reconnect: config.ws.reconnect,
      reconnectInterval: config.ws.reconnectInterval,
    },
    solana: {
      network: config.solana.network,
      rpcUrl: config.solana.rpcUrl.substring(0, 30) + '...', // 隐藏完整URL
    },
    features: config.features,
    app: config.app,
    thirdParty: {
      googleAnalytics: {
        enabled: config.thirdParty.googleAnalytics.enabled,
        // 不暴露GA ID
      },
      sentry: {
        enabled: config.thirdParty.sentry.enabled,
        // 不暴露Sentry DSN
      },
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(safeConfig, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}