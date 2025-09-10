# 🔗 钱包连接解决方案

## 问题描述

当使用IP地址访问应用时，Phantom钱包无法弹出连接窗口，但localhost访问正常。

**根本原因**: 浏览器安全策略要求钱包连接必须在安全上下文(Secure Context)中进行。

## 环境差异

| 访问方式 | 安全上下文 | 钱包连接 |
|----------|------------|----------|
| `http://localhost:3000` | ✅ 安全 | ✅ 正常 |
| `http://172.18.0.160:3000` | ❌ 不安全 | ❌ 失败 |
| `https://localhost:3000` | ✅ 安全 | ✅ 正常 |
| `https://172.18.0.160:3000` | ✅ 安全 | ✅ 正常 |

## 解决方案

### 🚀 一键启动HTTPS服务(推荐)

```bash
./scripts/start-https.sh
```

这会自动:
- 生成自签名HTTPS证书
- 启动前端HTTPS服务 (端口3000)
- 启动后端HTTPS服务 (端口3002)

### 📋 手动启动

```bash
# 生成证书(仅首次)
./scripts/generate-certs.sh

# 启动后端HTTPS
cd backend && npm run dev:https

# 启动前端HTTPS(新终端)
npm run dev:https
```

### 🌐 访问地址

启动后访问:
- `https://localhost:3000`
- `https://172.18.0.160:3000`

⚠️ **首次访问**: 浏览器会显示证书警告，点击"高级" → "继续访问"即可

## 技术实现

### 核心文件

1. **证书生成**: `scripts/generate-certs.sh`
2. **前端HTTPS服务器**: `server-https.js`
3. **后端HTTPS服务器**: `backend/src/server-https.ts`
4. **API协议适配**: `src/lib/api.ts`

### 智能协议匹配

```javascript
// API会根据前端协议自动选择后端协议
const protocol = window.location.protocol;
const apiProtocol = protocol === 'https:' ? 'https' : 'http';
const apiUrl = `${apiProtocol}://${host}:3002/api/v1`;
```

## 验证方法

1. 访问 `/wallet-fix-guide` 查看当前环境状态
2. 点击"测试Phantom连接"按钮
3. 如果弹出Phantom授权窗口 = 解决成功 ✅

## 注意事项

- 证书是自签名的，仅用于开发环境
- 生产环境应使用正式SSL证书
- 首次访问每个HTTPS地址都会有证书警告
- 证书有效期365天