# 配置指南

## 📋 概述

本项目使用环境变量进行配置管理，支持开发、测试和生产等多种环境。

## 🚀 快速开始

### 1. 开发环境

```bash
# 复制配置文件（如果不存在）
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

默认配置会自动使用当前主机地址，支持局域网访问。

### 2. 生产环境

```bash
# 复制生产配置模板
cp .env.production.example .env.production

# 编辑配置文件，填写实际的服务器地址
vim .env.production

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 📝 配置文件说明

### 环境文件优先级

1. `.env.production` - 生产环境（npm run build 时使用）
2. `.env.local` - 本地开发环境（不会被git追踪）
3. `.env` - 默认配置

### 核心配置项

#### API配置

```env
# 后端API地址
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# 旧版API地址（journal等服务）
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

- **开发环境**：留空自动使用当前主机地址
- **生产环境**：必须设置为实际的API服务器地址

#### WebSocket配置

```env
# WebSocket服务器地址
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com

# 是否启用WebSocket
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

- **开发环境**：通常设置为 `false`，避免连接错误
- **生产环境**：如果有WebSocket服务器则设置为 `true`

#### Solana配置

```env
# Solana RPC节点
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# 网络类型：mainnet-beta, devnet, testnet
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## 🌐 不同部署场景

### 1. 本地开发

`.env.local`:
```env
# API和WebSocket留空，自动使用localhost
# NEXT_PUBLIC_API_URL=
# NEXT_PUBLIC_WS_URL=

NEXT_PUBLIC_ENABLE_WEBSOCKET=false
NEXT_PUBLIC_DEV_MODE=true
```

### 2. 局域网测试

`.env.local`:
```env
# API和WebSocket留空，自动使用访问的IP地址
# 其他设备通过 http://192.168.x.x:3000 访问

NEXT_PUBLIC_ENABLE_WEBSOCKET=false
NEXT_PUBLIC_DEV_MODE=true
```

### 3. 云服务器部署

`.env.production`:
```env
# 使用实际的域名
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com

NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_DEV_MODE=false
```

### 4. Docker部署

创建 `.env.docker`:
```env
# 使用Docker内部网络地址
NEXT_PUBLIC_API_URL=http://backend:3002/api/v1
NEXT_PUBLIC_WS_URL=ws://backend:5002

NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

### 5. Vercel/Netlify部署

在平台的环境变量设置中添加：

- `NEXT_PUBLIC_API_URL` = `https://your-api.vercel.app/api/v1`
- `NEXT_PUBLIC_WS_URL` = `wss://your-ws.vercel.app`
- `NEXT_PUBLIC_ENABLE_WEBSOCKET` = `true`

## 🔧 高级配置

### 功能开关

```env
# 开发者模式（显示调试信息）
NEXT_PUBLIC_DEV_MODE=true

# 模拟模式（使用假数据，无需后端）
NEXT_PUBLIC_MOCK_MODE=false

# 启用WebSocket
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

### 第三方服务

```env
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry错误追踪
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## 🔍 配置验证

在浏览器控制台运行：

```javascript
// 查看当前配置
window.__APP_CONFIG__

// 或在代码中
import { printConfig } from '@/config';
printConfig();
```

## 📊 配置检查清单

部署前请确认：

- [ ] API地址配置正确
- [ ] WebSocket地址配置正确（如需要）
- [ ] Solana网络配置正确
- [ ] 生产环境关闭了DEV_MODE
- [ ] 敏感信息没有提交到代码仓库
- [ ] `.env.local` 和 `.env.production` 已添加到 `.gitignore`

## 🚨 常见问题

### 1. WebSocket连接失败

**问题**：控制台显示 "WebSocket connection failed"

**解决**：
- 开发环境：设置 `NEXT_PUBLIC_ENABLE_WEBSOCKET=false`
- 生产环境：确保WebSocket服务器正在运行

### 2. API请求失败

**问题**：API请求返回网络错误

**解决**：
- 检查 `NEXT_PUBLIC_API_URL` 是否正确
- 确保后端服务器正在运行
- 检查CORS设置

### 3. 其他设备无法访问

**问题**：局域网内其他设备无法访问

**解决**：
- 确保防火墙允许端口访问
- 使用 `npm run dev -- --host 0.0.0.0`
- 访问时使用服务器IP地址，如 `http://192.168.1.100:3000`

## 📚 相关文档

- [Next.js环境变量](https://nextjs.org/docs/basic-features/environment-variables)
- [部署指南](./DEPLOYMENT.md)
- [开发指南](./DEVELOPMENT.md)