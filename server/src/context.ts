import { PrismaClient } from '@/generated/prisma/client';

export type AppContext = {
  db: PrismaClient;
  destroy: () => Promise<void>;
};

export async function createAppContext(): Promise<AppContext> {
  // Create database client
  const db = new PrismaClient();
  await db.$connect();

  return {
    db,
    destroy: async () => {
      await db.$disconnect();
    },
  };
}
