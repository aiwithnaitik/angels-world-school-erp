# Deployment Guide

This app is deployed from the project root, the folder containing `package.json`.

## Required Environment

- Node.js 22 LTS or newer
- PostgreSQL
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT=3000`

Use `.env.example` as the template. Generate a long random `JWT_SECRET` for production.

## VPS With PM2

```bash
npm ci
npm run prisma:migrate
npm run build
npm run deploy:pm2
pm2 save
```

Install `deployment/nginx.conf` as an Nginx site, update `server_name` and certificate paths, then run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Docker

```bash
docker build -t angels-world-erp .
docker run --env-file .env -p 3000:3000 angels-world-erp
```

Run database migrations before starting the production container, or run them as a separate release step.

## Deployment Hygiene

Do not upload these to the server:

- `node_modules/`
- `.next/`
- `.env`
- `*.log`
- local zip/tar archives

Use `npm ci` on the server or build the provided Docker image.
