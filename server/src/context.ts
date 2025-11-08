import type { OAuthClient } from '@atproto/oauth-client-node';
import type { PrismaClient } from '@/generated/prisma/client';
import { db } from '@/lib/db';
import { oauthClient } from '@/lib/oauthClient';

export type AppContext = {
  db: PrismaClient;
  oauthClient: OAuthClient;
  destroy: () => Promise<void>;
};

export async function createAppContext(): Promise<AppContext> {
  // Create database client
  await db.$connect();

  return {
    db,
    oauthClient,
    destroy: async () => {
      await db.$disconnect();
    },
  };
}
