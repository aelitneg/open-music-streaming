import { RequestListener } from 'node:http';
import express from 'express';
import { handler } from '../lib/http';

export function createRouter(): RequestListener {
  const router = express();

  router.get(
    '/healthcheck',
    handler((req, res) => {
      return res.status(200).send('OK');
    }),
  );

  return router;
}
