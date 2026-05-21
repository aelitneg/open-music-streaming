import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema.js';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

export default fp(async (app) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  app.decorate('db', db);

  app.addHook('onClose', async () => {
    await pool.end();
  });
});
