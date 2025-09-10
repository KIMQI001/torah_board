module.exports = {
  apps: [
    {
      // 应用名称
      name: 'web3-dashboard',
      
      // 启动脚本
      script: 'npm',
      args: 'start',
      
      // 运行目录
      cwd: './',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // 生产环境变量
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // 实例配置
      instances: 1,  // 单实例，避免端口冲突
      exec_mode: 'fork',  // fork模式
      
      // 自动重启配置
      autorestart: true,
      watch: false,  // 生产环境不监听文件变化
      max_memory_restart: '1G',
      
      // 日志配置
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 进程配置
      min_uptime: '10s',
      max_restarts: 5,
      
      // 环境配置
      node_args: '--max_old_space_size=4096',
    }
  ],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'node',
      host: '172.18.0.160',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/web3-dashboard.git',
      path: '/var/www/web3-dashboard',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};