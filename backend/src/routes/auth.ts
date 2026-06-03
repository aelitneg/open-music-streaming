import fp from 'fastify-plugin';
import { Agent } from '@atproto/api';
import { isValidHandle } from '@atproto/syntax';

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

      const agent = new Agent(oauthSession);
      const { data: repo } = await agent.com.atproto.repo.describeRepo({
        repo: oauthSession.did,
      });

      request.session.did = oauthSession.did;
      request.session.handle = repo.handle;
      await request.session.save();

      const frontendUrl = process.env.FRONTEND_URL ?? '/';
      return reply.redirect(frontendUrl);
    } catch (err) {
      app.log.error({ err }, 'oauth callback failed');
      const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:8080';
      const signinUrl = new URL('/signin', frontendBase);
      signinUrl.searchParams.set('error', 'callback_failed');
      return reply.redirect(signinUrl.toString());
    }
  });

  // Returns the current session status
  app.get('/auth/session', async (request, reply) => {
    if (!request.session.did) {
      return reply.status(401).send({ authenticated: false });
    }
    return {
      authenticated: true,
      did: request.session.did,
      handle: request.session.handle,
    };
  });

  // Revokes the OAuth session and destroys the cookie
  app.post('/auth/logout', async (request, reply) => {
    if (request.session.did) {
      try {
        const oauthSession = await app.oauthClient.restore(request.session.did);
        if (oauthSession) await oauthSession.signOut();
      } catch (err) {
        app.log.warn({ err }, 'failed to revoke oauth session');
      }
    }
    request.session.destroy();
    return { success: true };
  });
});
