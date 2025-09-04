# 增强CEX公告抓取系统使用指南

## 概述

本系统提供了一套完整的CEX公告抓取解决方案，包含多重反爬虫绕过机制、智能数据源切换、以及健壮的错误处理。

## 核心特性

### 1. 反爬虫绕过机制
- **智能请求头轮换**: 动态生成多样化的浏览器请求头
- **用户代理池**: 包含Chrome、Firefox、Safari等多种浏览器标识
- **随机延迟**: 模拟人类访问行为的随机等待时间
- **代理池支持**: 可集成付费代理服务避免IP封禁
- **会话管理**: 维持持久化会话状态

### 2. 多数据源策略
- **API优先**: 首先尝试官方或半公开API
- **网页抓取备选**: API失败时自动切换到网页解析
- **RSS订阅**: 部分交易所提供RSS源
- **Fallback数据**: 确保始终有数据返回

### 3. 智能数据提取
- **多种解析策略**: 支持JSON、HTML、正则表达式等多种数据提取方式
- **去重处理**: 自动识别并移除重复公告
- **数据验证**: 确保提取的数据格式正确

## 使用示例

### 基本用法

```typescript
import { CexScraperService } from './services/cex-scraper.service';

// 获取所有交易所公告
const announcements = await CexScraperService.scrapeAllExchanges();
console.log(`获取到 ${announcements.length} 条公告`);

// 单独获取Binance公告
const binanceAnnouncements = await CexScraperService.scrapeBinanceAnnouncements();

// 单独获取OKX公告  
const okxAnnouncements = await CexScraperService.scrapeOkxAnnouncements();
```

### 配置管理

```typescript
import { ScraperConfigManager, applyPresetConfig } from './config/scraper.config';

// 使用预设配置
applyPresetConfig('aggressive'); // 激进模式
applyPresetConfig('conservative'); // 保守模式
applyPresetConfig('balanced'); // 平衡模式

// 自定义配置
ScraperConfigManager.updateConfig({
  request: {
    timeout: 20000,
    maxRetries: 5,
  },
  antiDetection: {
    enableProxy: true,
    useRandomDelay: true,
  },
});

// 获取启用的交易所
const exchanges = ScraperConfigManager.getEnabledExchanges();
```

### 健康检查

```typescript
// 检查各数据源状态
const healthStatus = await CexScraperService.healthCheck();
console.log('数据源状态:', healthStatus);
/*
{
  binance_api: true,
  okx_api: false,
  binance_web: true,
  okx_web: true
}
*/
```

### 反爬虫服务单独使用

```typescript
import { AntiDetectionService } from './services/anti-detection.service';

// 发送智能请求
const response = await AntiDetectionService.makeSmartRequest('https://example.com', {
  headers: { 'Referer': 'https://example.com' },
  meta: { exchange: 'binance' },
});

// 检测反爬虫响应
const isBlocked = AntiDetectionService.isAntiCrawlerResponse(responseData);

// 创建持久化会话
const session = AntiDetectionService.createSession();
```

## 配置选项说明

### 请求配置
```typescript
request: {
  timeout: 30000,        // 请求超时时间(ms)
  maxRetries: 3,         // 最大重试次数
  retryDelay: 2000,      // 重试延迟(ms)
  maxConcurrent: 5,      // 最大并发请求数
  humanDelayMin: 1000,   // 人为延迟最小值(ms)
  humanDelayMax: 3000,   // 人为延迟最大值(ms)
}
```

### 反爬虫配置
```typescript
antiDetection: {
  rotateUserAgent: true,      // 轮换User-Agent
  rotateHeaders: true,        // 轮换请求头
  useRandomDelay: true,       // 使用随机延迟
  enableProxy: false,         // 启用代理
  enableSession: true,        // 启用会话管理
  maxRequestsPerSession: 20,  // 每会话最大请求数
}
```

### 数据提取配置
```typescript
extraction: {
  maxAnnouncementsPerSource: 20,  // 每个数据源最大公告数
  minTitleLength: 5,              // 标题最小长度
  maxTitleLength: 200,            // 标题最大长度
  enableDeduplication: true,      // 启用去重
  duplicateThreshold: 0.8,        // 重复检测阈值
}
```

## 数据源优先级

系统按以下优先级获取数据：

1. **Binance** (优先级: 10)
   - API数据源 → 网页抓取 → RSS → Fallback数据

2. **OKX** (优先级: 9)  
   - API数据源 → 网页抓取 → Fallback数据

3. **Bybit** (优先级: 8)
   - API数据源 → Fallback数据

## 错误处理策略

### HTTP错误码处理
- **200**: 正常响应，解析数据
- **202**: 反爬虫检测，延长等待时间后重试
- **403**: 访问被拒绝，切换数据源或使用代理
- **429**: 请求频率限制，根据Retry-After头部等待
- **5xx**: 服务器错误，指数退避重试

### 反爬虫检测
系统会自动检测以下反爬虫响应：
- Cloudflare防护页面
- "Please enable JavaScript"提示
- 验证码页面
- 异常小的响应内容

## 部署建议

### 开发环境
```typescript
// 使用快速配置
applyPresetConfig('aggressive');
```

### 生产环境
```typescript
// 使用保守配置
applyPresetConfig('conservative');

// 或手动配置
ScraperConfigManager.updateConfig({
  antiDetection: {
    enableProxy: true,
    useRandomDelay: true,
  },
  cache: {
    ttl: 600, // 10分钟缓存
  },
});
```

### 代理配置
```typescript
// 在AntiDetectionService中配置代理池
private static freeProxies: ProxyConfig[] = [
  { 
    host: 'proxy.example.com', 
    port: 8080,
    auth: {
      username: 'user',
      password: 'pass'
    }
  },
];
```

## 监控和日志

系统提供详细的日志记录：

```
🚀 开始使用增强策略抓取Binance公告数据...
🔍 尝试数据源: binance-cms-api (优先级: 10)
✅ binance-cms-api 成功获取 15 条公告
🎉 综合抓取完成，共获取42条公告，去重后38条
```

## 扩展指南

### 添加新交易所

1. 在`cex-api-sources.service.ts`中添加API配置
2. 在`scraper.config.ts`中添加交易所配置
3. 实现对应的数据解析方法

### 自定义数据源

```typescript
const customSource: ApiEndpoint = {
  name: 'custom-api',
  url: 'https://api.custom.com/announcements',
  priority: 5,
  parser: (data: any) => parseCustomResponse(data),
};
```

## 常见问题

**Q: 为什么有时返回示例数据？**
A: 当所有数据源都失败时，系统会返回示例数据确保服务可用。

**Q: 如何提高抓取成功率？**
A: 启用代理、使用保守配置、减少请求频率。

**Q: 数据多久更新一次？**
A: 默认缓存5分钟，可通过配置调整。

**Q: 如何避免被封IP？**
A: 使用代理池、随机延迟、限制请求频率。