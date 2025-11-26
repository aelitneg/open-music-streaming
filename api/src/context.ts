import type { OAuthClient } from '@atproto/oauth-client-node';
import type { PrismaClient } from '@/generated/prisma/client';
import { db, pool } from '@/lib/db';
import { createOAuthClient } from '@/lib/oauthClient';

export type AppContext = {
  db: PrismaClient;
  oauthClient: OAuthClient;
  destroy: () => Promise<void>;
};

export async function createAppContext(): Promise<AppContext> {
  // Create database client
  await db.$connect();

  // Create OAuth client
  const oauthClient = await createOAuthClient();

  return {
    db,
    oauthClient,
    destroy: async () => {
      await db.$disconnect();
      await pool.end();
    },
  };
}
