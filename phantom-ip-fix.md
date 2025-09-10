# Phantom钱包IP访问解决方案

## 问题
Phantom钱包插件出于安全考虑，只允许localhost和受信任的域名访问，不允许直接IP地址访问。

## 解决方案

### 方案1: 本地域名映射（推荐）

1. **在你的Mac上修改hosts文件**:
```bash
sudo vim /etc/hosts
```

添加这行：
```
172.18.0.160 web3-dashboard.local
```

2. **在其他电脑上也修改hosts文件**:

**Windows**:
- 以管理员身份运行记事本
- 打开 `C:\Windows\System32\drivers\etc\hosts`
- 添加: `172.18.0.160 web3-dashboard.local`

**Mac/Linux**:
```bash
sudo vim /etc/hosts
# 添加: 172.18.0.160 web3-dashboard.local
```

3. **访问新域名**:
```
http://web3-dashboard.local:3000
```

### 方案2: 使用ngrok隧道服务

1. **安装ngrok**:
```bash
brew install ngrok
# 或下载: https://ngrok.com/download
```

2. **创建隧道**:
```bash
ngrok http 3000
```

3. **使用ngrok提供的HTTPS URL访问**

### 方案3: 修改Phantom信任设置（不推荐）

在Phantom插件设置中：
1. 打开Phantom插件
2. 设置 → 开发者设置
3. 启用"信任本地开发环境"
4. 添加 `http://172.18.0.160:3000` 到信任列表

## 当前状态
- ✅ localhost:3000 - 可以连接钱包
- ❌ 172.18.0.160:3000 - 钱包连接超时
- ✅ 后端API - 支持IP访问
- ✅ 前端加载 - 支持IP访问

## 测试
配置完成后访问: http://web3-dashboard.local:3000/wallet-test