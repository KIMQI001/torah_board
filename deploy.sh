#!/bin/bash

# ====================================
# Web3 Dashboard 部署脚本
# ====================================

echo "🚀 Web3 Dashboard 部署脚本"
echo "=========================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否存在生产环境配置
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ 错误: 未找到 .env.production 文件${NC}"
    echo "请先配置生产环境文件"
    exit 1
fi

echo -e "${GREEN}✓ 找到生产环境配置文件${NC}"

# 显示当前配置
echo ""
echo "📋 当前配置:"
echo "------------------------"
grep "NEXT_PUBLIC_API_URL\|NEXT_PUBLIC_WS_URL\|NEXT_PUBLIC_ENABLE_WEBSOCKET" .env.production | head -3
echo "------------------------"
echo ""

# 询问是否继续
read -p "是否使用以上配置继续部署? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 1
fi

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 构建项目
echo ""
echo "🔨 构建生产版本..."
npm run build

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败，请检查错误信息${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 构建成功${NC}"

# 询问是否启动服务器
echo ""
read -p "是否立即启动生产服务器? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌐 启动生产服务器..."
    echo "服务器地址: http://172.18.0.160:3000"
    echo "按 Ctrl+C 停止服务器"
    echo "------------------------"
    
    # 使用 PORT 环境变量指定端口
    PORT=3000 npm start
else
    echo ""
    echo "📝 部署准备完成！"
    echo ""
    echo "手动启动命令:"
    echo "  PORT=3000 npm start"
    echo ""
    echo "或使用 PM2:"
    echo "  pm2 start ecosystem.config.js"
fi