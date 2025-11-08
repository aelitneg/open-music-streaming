import type {
  NodeSavedState,
  NodeSavedStateStore,
  NodeSavedSession,
  NodeSavedSessionStore,
} from '@atproto/oauth-client-node';
import type { PrismaClient } from '@/generated/prisma/client';

export class StateStore implements NodeSavedStateStore {
  constructor(private db: PrismaClient) {}

  async get(key: string): Promise<NodeSavedState | undefined> {
    const result = await this.db.authState.findFirst({ where: { key } });
    if (!result) return;

    return JSON.parse(result.state) as NodeSavedState;
  }

  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val);

    await this.db.authState.upsert({
      where: { key },
      update: { state },
      create: { key, state },
    });
  }

  async del(key: string) {
    await this.db.authState.delete({ where: { key } });
  }
}

export class SessionStore implements NodeSavedSessionStore {
  constructor(private db: PrismaClient) {}

  async get(key: string): Promise<NodeSavedSession | undefined> {
    try {
      const result = await this.db.authSession.findFirst({ where: { key } });

      if (!result) return;

      return JSON.parse(result.session) as NodeSavedSession;
    } catch (error) {
      console.error('SessionStore.get ERROR', error);
    }
  }

  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val);

    await this.db.authSession.upsert({
      where: { key },
      update: { session },
      create: { key, session },
    });
  }

  async del(key: string) {
    await this.db.authSession.delete({ where: { key } });
  }
}
