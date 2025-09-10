#!/bin/bash

# 创建证书目录
mkdir -p certs

# 生成私钥
openssl genrsa -out certs/private-key.pem 2048

# 生成证书请求配置
cat > certs/cert.conf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
CN=172.18.0.160

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = 172.18.0.160
EOF

# 生成证书签名请求
openssl req -new -key certs/private-key.pem -out certs/cert.csr -config certs/cert.conf

# 生成自签名证书
openssl x509 -req -in certs/cert.csr -signkey certs/private-key.pem -out certs/certificate.pem -days 365 -extensions v3_req -extfile certs/cert.conf

echo "✅ HTTPS证书生成完成!"
echo "证书位置: certs/certificate.pem"
echo "私钥位置: certs/private-key.pem"
echo ""
echo "使用方法:"
echo "1. 运行 npm run dev:https"
echo "2. 访问 https://172.18.0.160:3000"
echo "3. 浏览器会警告证书不安全，点击'高级' -> '继续访问'"