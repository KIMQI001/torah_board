#!/bin/bash

echo "🚀 启动HTTPS前后端服务..."

# 检查证书是否存在
if [ ! -f "certs/certificate.pem" ] || [ ! -f "certs/private-key.pem" ]; then
    echo "📜 生成HTTPS证书..."
    ./scripts/generate-certs.sh
fi

# 后台启动后端HTTPS服务
echo "🔧 启动后端HTTPS服务..."
cd backend
npm run dev:https &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 启动前端HTTPS服务
echo "🌐 启动前端HTTPS服务..."
npm run dev:https &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动完成!"
echo ""
echo "🔗 访问地址:"
echo "   - 前端: https://localhost:3000"
echo "   - 前端(网络): https://172.18.0.160:3000"
echo "   - 后端API: https://localhost:3002/api/v1"
echo "   - 后端健康检查: https://172.18.0.160:3002/health"
echo ""
echo "⚠️  首次访问会有证书警告，选择'高级' -> '继续访问'"
echo ""
echo "📋 进程ID:"
echo "   - 后端PID: $BACKEND_PID"
echo "   - 前端PID: $FRONTEND_PID"
echo ""
echo "🛑 停止服务: Ctrl+C 或 kill $BACKEND_PID $FRONTEND_PID"

# 等待用户中断
wait