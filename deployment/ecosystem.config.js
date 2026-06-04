module.exports = {
  apps: [
    {
      name: 'angels-world-erp',
      script: './.next/standalone/server.js',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
