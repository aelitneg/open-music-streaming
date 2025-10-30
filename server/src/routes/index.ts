import { RequestListener } from 'node:http';
import express from 'express';
import type { AppContext } from '@/context';
import { handler } from '@/lib/http';

export function createRouter(ctx: AppContext): RequestListener {
  const router = express();

  router.get(
    '/healthcheck',
    handler((req, res) => {
      return res.status(200).send('OK');
    }),
  );

  return router;
}
