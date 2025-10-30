import { RequestListener } from 'node:http';
import express from 'express';
import type { AppContext } from '@/context';
import { handler } from '@/lib/http';

export function createRouter(ctx: AppContext): RequestListener {
  const router = express();

  router.get(
    '/healthcheck',
    handler(async (req, res) => {
      let db = false;

      try {
        db = Boolean(await ctx.db.$queryRaw`SELECT 1`);
        return res.status(200).json({ status: 'ok', db });
      } catch (err) {
        return res.status(503).json({ status: 'degraded', db });
      }
    }),
  );

  return router;
}
