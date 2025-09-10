const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // 绑定到所有接口
const port = process.env.PORT || 3000;

// Next.js应用
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// HTTPS选项
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs/private-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/certificate.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, hostname, () => {
    console.log(`🚀 HTTPS服务器运行中:`);
    console.log(`   - 本地访问: https://localhost:${port}`);
    console.log(`   - 网络访问: https://172.18.0.160:${port}`);
    console.log(`   - 环境: ${dev ? 'development' : 'production'}`);
    console.log('');
    console.log('📝 注意事项:');
    console.log('   - 首次访问会有证书警告，选择"继续访问"');
    console.log('   - 这将提供安全上下文，Phantom钱包可以正常连接');
  });
});