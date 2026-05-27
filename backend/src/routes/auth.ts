import crypto from 'node:crypto';
import fp from 'fastify-plugin';
import { isValidHandle } from '@atproto/syntax';
import { getIronSession } from 'iron-session';

type Session = { did: string };

const COOKIE_SECRET = process.env.COOKIE_SECRET;
if (!COOKIE_SECRET) throw new Error('COOKIE_SECRET is not set');

const sessionOptions = {
  cookieName: 'sid',
  password: COOKIE_SECRET,
};

// Short-lived single-use tokens bridging the 127.0.0.1 callback to the localhost finalize step.
// See docs/decisions/0003-oauth-loopback-session-handoff.md
const handoffTokens = new Map<string, { did: string; createdAt: Date }>();

export default fp(async (app) => {
  // AT Protocol discovery endpoints — required at fixed paths
  app.get('/oauth-client-metadata.json', async (_req, reply) => {
    reply.header('cache-control', 'no-store');
    return app.oauthClient.clientMetadata;
  });

  app.get('/.well-known/jwks.json', async (_req, reply) => {
    reply.header('cache-control', 'no-store');
    return app.oauthClient.jwks;
  });

  // Initiate OAuth flow — returns the authorization URL for the client to redirect to
  app.post('/auth/login', async (request, reply) => {
    const { handle } = request.body as { handle?: string };

    if (typeof handle !== 'string' || !isValidHandle(handle)) {
      return reply.status(400).send({ error: 'invalid handle' });
    }

    try {
      const url = await app.oauthClient.authorize(handle, {
        scope: 'atproto transition:generic',
      });
      return { url: url.toString() };
    } catch (err) {
      app.log.error({ err }, 'oauth authorize failed');
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'failed to initiate login',
      });
    }
  });

  // AT Protocol redirect URI — exchanges the auth code and issues a handoff token.
  // The redirect URI is on 127.0.0.1; cookies set here would be scoped to that origin.
  // Instead we store the DID under a short-lived token and redirect to /auth/finalize
  // on localhost so the session cookie is set on the correct origin.
  app.get('/oauth/callback', async (request, reply) => {
    const params = new URLSearchParams(request.query as Record<string, string>);

    try {
      const { session } = await app.oauthClient.callback(params);

      const token = crypto.randomBytes(32).toString('hex');
      handoffTokens.set(token, { did: session.did, createdAt: new Date() });

      const port = process.env.PORT ?? 4000;
      return reply.redirect(
        `http://localhost:${port}/auth/finalize?token=${token}`,
      );
    } catch (err) {
      app.log.error({ err }, 'oauth callback failed');
      return reply.status(500).send({ error: 'oauth callback failed' });
    }
  });

  // Finalizes the session on the localhost origin.
  // Validates the handoff token (single-use, ≤60s), sets the httpOnly session cookie.
  app.get('/auth/finalize', async (request, reply) => {
    const { token } = request.query as { token?: string };

    if (!token) {
      return reply.status(400).send({ error: 'missing token' });
    }

    const entry = handoffTokens.get(token);
    handoffTokens.delete(token);

    if (!entry) {
      return reply.status(400).send({ error: 'invalid token' });
    }

    const ageMs = Date.now() - entry.createdAt.getTime();
    if (ageMs > 60_000) {
      return reply.status(400).send({ error: 'token expired' });
    }

    const session = await getIronSession<Session>(
      request.raw,
      reply.raw,
      sessionOptions,
    );
    session.did = entry.did;
    await session.save();

    const frontendUrl = process.env.FRONTEND_URL ?? '/';
    return reply.redirect(frontendUrl);
  });

  // Returns the current session status
  app.get('/auth/session', async (request, reply) => {
    const session = await getIronSession<Session>(
      request.raw,
      reply.raw,
      sessionOptions,
    );

    if (!session.did) {
      return reply.status(401).send({ authenticated: false });
    }

    return { authenticated: true, did: session.did };
  });

  // Revokes the OAuth session and destroys the cookie
  app.post('/auth/logout', async (request, reply) => {
    const session = await getIronSession<Session>(
      request.raw,
      reply.raw,
      sessionOptions,
    );

    if (session.did) {
      try {
        const oauthSession = await app.oauthClient.restore(session.did);
        if (oauthSession) await oauthSession.signOut();
      } catch (err) {
        app.log.warn({ err }, 'failed to revoke oauth session');
      }
    }

    session.destroy();
    return { success: true };
  });
});
