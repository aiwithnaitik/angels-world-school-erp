# Angels World School ERP

Next.js ERP application for Angels World School with role-based dashboards, student/staff records, attendance, fees, notices, reports, settings, and system logs.

## Project Layout

```text
.
├── deployment/          # PM2 and Nginx production configuration
├── prisma/              # Prisma schema and migrations
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages and API routes
│   ├── components/      # Shared UI components
│   ├── hooks/           # React hooks
│   ├── lib/             # Auth, Prisma, and local data helpers
│   ├── modules/         # Feature modules used by dashboards
│   └── services/        # Data service layer
├── .env.example         # Required environment variables
├── Dockerfile           # Container deployment target
└── package.json         # Scripts and dependencies
```

## Local Development

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:3000/login`.

## Useful Scripts

- `npm run dev` starts the local Next.js server.
- `npm run build` generates Prisma Client and builds the standalone Next.js app.
- `npm run start` runs the production server after a build.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript checks.
- `npm run prisma:migrate` applies production database migrations.
- `npm run deploy:pm2` starts the production app with PM2.

## Deployment

See [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md).
