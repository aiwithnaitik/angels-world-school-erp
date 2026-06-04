import { PrismaClient } from '@prisma/client';
import { isMockDataAllowed } from './security';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Helper to test if database connection is fully available
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    if (!isMockDataAllowed()) {
      console.error('PostgreSQL database is not reachable and mock data fallback is disabled in production.', error);
      throw error;
    }
    console.warn('PostgreSQL database is not reachable. Falling back to local mock data.', error);
    return false;
  }
}
