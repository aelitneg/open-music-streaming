import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import dbPlugin from './plugins/db.js';
import oauthPlugin from './plugins/oauth.js';
import sessionPlugin from './plugins/session.js';
import rootRoute from './routes/root.js';
import authRoutes from './routes/auth.js';
import artistRoutes from './routes/artists.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(multipart, { limits: { fileSize: 52428800 } }); // 50MB — Bluesky PDS blob upload limit (docs.bsky.app/docs/advanced-guides/rate-limits)
  app.register(dbPlugin);
  app.register(oauthPlugin);
  app.register(sessionPlugin);
  app.register(rootRoute);
  app.register(authRoutes);
  app.register(artistRoutes);

  return app;
}
