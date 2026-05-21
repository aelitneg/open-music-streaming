import fp from 'fastify-plugin';
import {
  atprotoLoopbackClientMetadata,
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedSessionStore,
  type NodeSavedState,
  type NodeSavedStateStore,
} from '@atproto/oauth-client-node';
import { eq } from 'drizzle-orm';
import { authSession, authState } from '../db/schema.js';
import type { Database } from '../plugins/db.js';

declare module 'fastify' {
  interface FastifyInstance {
    oauthClient: NodeOAuthClient;
  }
}

class StateStore implements NodeSavedStateStore {
  constructor(private db: Database) {}

  async get(key: string): Promise<NodeSavedState | undefined> {
    const [row] = await this.db
      .select()
      .from(authState)
      .where(eq(authState.key, key))
      .limit(1);
    if (!row) return undefined;
    return JSON.parse(row.state) as NodeSavedState;
  }

  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val);
    await this.db
      .insert(authState)
      .values({ key, state })
      .onConflictDoUpdate({ target: authState.key, set: { state } });
  }

  async del(key: string) {
    await this.db.delete(authState).where(eq(authState.key, key));
  }
}

class SessionStore implements NodeSavedSessionStore {
  constructor(private db: Database) {}

  async get(key: string): Promise<NodeSavedSession | undefined> {
    const [row] = await this.db
      .select()
      .from(authSession)
      .where(eq(authSession.key, key))
      .limit(1);
    if (!row) return undefined;
    return JSON.parse(row.session) as NodeSavedSession;
  }

  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val);
    await this.db
      .insert(authSession)
      .values({ key, session })
      .onConflictDoUpdate({ target: authSession.key, set: { session } });
  }

  async del(key: string) {
    await this.db.delete(authSession).where(eq(authSession.key, key));
  }
}

export default fp(async (app) => {
  const port = process.env.PORT ?? 4000;

  const clientMetadata = atprotoLoopbackClientMetadata(
    `http://localhost?${new URLSearchParams([
      ['redirect_uri', `http://127.0.0.1:${port}/oauth/callback`],
      ['scope', 'atproto transition:generic'],
    ])}`,
  );

  const oauthClient = new NodeOAuthClient({
    clientMetadata,
    stateStore: new StateStore(app.db),
    sessionStore: new SessionStore(app.db),
    plcDirectoryUrl: process.env.PLC_URL ?? 'https://plc.directory',
    handleResolver: process.env.PDS_URL ?? 'https://bsky.social',
  });

  app.decorate('oauthClient', oauthClient);
});
