# 🚀 部署指南

## 📋 服务器配置

- **前端地址**: http://172.18.0.160:3000
- **后端API**: http://172.18.0.160:3002
- **WebSocket**: ws://172.18.0.160:5002

## 🎯 快速部署

### 方法一：使用部署脚本（推荐）

```bash
# 一键部署
./deploy.sh
```

部署脚本会自动：
1. 检查配置文件
2. 安装依赖
3. 构建项目
4. 询问是否启动服务

### 方法二：手动部署

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 启动服务（选择其中一种）

# 简单启动
PORT=3000 npm start

# 或使用PM2管理
pm2 start ecosystem.config.js
```

## 🛠️ PM2 管理命令

```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs web3-dashboard

# 重启应用
pm2 restart web3-dashboard

# 停止应用
pm2 stop web3-dashboard

# 删除应用
pm2 delete web3-dashboard

# 监控
pm2 monit
```

## 🔍 验证部署

### 1. 检查服务状态
```bash
# 检查端口是否开放
curl http://172.18.0.160:3000

# 检查API配置
curl http://172.18.0.160:3000/api/config
```

### 2. 浏览器访问
- **前端**: http://172.18.0.160:3000
- **配置页面**: http://172.18.0.160:3000/api/config

### 3. 控制台检查
在浏览器控制台查看：
```javascript
// 应该显示正确的配置
========== Current Configuration ==========
Environment: Production
API URL: http://172.18.0.160:3002/api/v1
WebSocket URL: ws://172.18.0.160:5002
WebSocket Enabled: false
==========================================
```

## 🌐 网络配置

### 防火墙设置
确保以下端口开放：
```bash
# 前端端口
sudo ufw allow 3000

# 后端API端口
sudo ufw allow 3002

# WebSocket端口（如果启用）
sudo ufw allow 5002
```

### Nginx反向代理（可选）

如果使用Nginx，配置示例：

```nginx
server {
    listen 80;
    server_name 172.18.0.160;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket代理
    location /ws {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 🔧 配置调整

### 启用WebSocket
如果后端WebSocket服务准备好了：

```bash
# 编辑配置文件
vim .env.production

# 修改这一行
NEXT_PUBLIC_ENABLE_WEBSOCKET=true

# 重新构建和重启
npm run build
pm2 restart web3-dashboard
```

### 修改端口
```bash
# 修改PM2配置
vim ecosystem.config.js

# 或者直接设置环境变量
PORT=8080 npm start
```

## 📊 监控和日志

### 查看日志
```bash
# PM2日志
pm2 logs web3-dashboard

# 应用日志文件
tail -f logs/app.log
tail -f logs/error.log
```

### 性能监控
```bash
# PM2监控界面
pm2 monit

# 系统资源
htop
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

2. **权限问题**
```bash
# 给予执行权限
chmod +x deploy.sh

# 检查文件权限
ls -la
```

3. **内存不足**
```bash
# 增加swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

4. **构建失败**
```bash
# 清除缓存重试
rm -rf .next node_modules
npm install
npm run build
```

## 📈 生产环境优化

### 性能优化
```bash
# 使用生产模式
NODE_ENV=production npm start

# 启用gzip压缩（Nginx）
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 安全配置
```bash
# 设置文件权限
chmod 644 .env.production
chmod 755 deploy.sh

# 禁止直接访问配置文件
# 在Nginx中添加：
location ~ /\.(env|git) {
    deny all;
}
```

## 📞 支持

如果遇到问题：
1. 检查日志文件
2. 验证配置是否正确
3. 确认所有服务都在运行
4. 检查网络连接和防火墙设置