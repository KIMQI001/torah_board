#!/bin/bash

echo "🔥 检查防火墙和网络配置"
echo "=========================="

echo "1. 检查macOS应用防火墙状态："
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "无法检查防火墙状态"

echo ""
echo "2. 检查端口监听状态："
echo "前端端口 (3000):"
lsof -i :3000 | head -5

echo ""
echo "后端端口 (3002):"
lsof -i :3002

echo ""
echo "3. 检查网络接口："
ifconfig | grep -A 1 "172.18.0"

echo ""
echo "4. 测试本地端口连接："
echo "测试 localhost:3002..."
nc -z localhost 3002 && echo "✅ localhost:3002 可访问" || echo "❌ localhost:3002 不可访问"

echo "测试 172.18.0.160:3002..."
nc -z 172.18.0.160 3002 && echo "✅ 172.18.0.160:3002 可访问" || echo "❌ 172.18.0.160:3002 不可访问"

echo ""
echo "5. 检查进程监听地址："
netstat -an | grep 3002

echo ""
echo "6. 建议的解决方案："
echo "如果外部设备无法访问："
echo "- 检查系统偏好设置 -> 安全性与隐私 -> 防火墙"
echo "- 检查路由器端口转发设置"
echo "- 确认 Node.js 应用有防火墙访问权限"