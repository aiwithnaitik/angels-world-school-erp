const fs = require('fs');
const path = require('path');

// Next.js standalone server does not load the .env file automatically in production.
// We parse the .env file manually here and inject the environment variables into PM2.
let envConfig = {};
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Strip wrapping quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        envConfig[key] = value;
      }
    });
  }
} catch (e) {
  console.error('Could not load .env file for PM2:', e);
}

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
        PORT: '3000',
        ...envConfig
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '3000',
        ...envConfig
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
