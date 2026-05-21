import Fastify from 'fastify';
import dbPlugin from './plugins/db.js';
import oauthPlugin from './plugins/oauth.js';
import rootRoute from './routes/root.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(dbPlugin);
  app.register(oauthPlugin);
  app.register(rootRoute);

  return app;
}
