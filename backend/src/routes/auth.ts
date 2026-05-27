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

  // AT Protocol redirect URI — exchanges the auth code, sets the session cookie,
  // and redirects to the frontend. Both this route and the frontend run on 127.0.0.1,
  // so cookies set here are on the same host as the app. See docs/decisions/0005.
  app.get('/oauth/callback', async (request, reply) => {
    const params = new URLSearchParams(request.query as Record<string, string>);

    try {
      const { session: oauthSession } = await app.oauthClient.callback(params);

      const session = await getIronSession<Session>(
        request.raw,
        reply.raw,
        sessionOptions,
      );
      session.did = oauthSession.did;
      await session.save();

      const frontendUrl = process.env.FRONTEND_URL ?? '/';
      return reply.redirect(frontendUrl);
    } catch (err) {
      app.log.error({ err }, 'oauth callback failed');
      return reply.status(500).send({ error: 'oauth callback failed' });
    }
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
