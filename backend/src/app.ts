import Fastify from 'fastify';
import rootRoute from './routes/root.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(rootRoute);

  return app;
}
