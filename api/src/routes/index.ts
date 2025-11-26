import assert from 'node:assert';
import { RequestListener } from 'node:http';
import express from 'express';
import cors from 'cors';
import type { AppContext } from '@/context';
import { handler } from '@/lib/http';
import { createAuthRouter } from '@/routes/auth';

// Max age, in seconds, for static routes and assets
const MAX_AGE = process.env.NODE_ENV === 'production' ? 60 : 0;

assert(process.env.CLIENT_URL, 'CLIENT_URL is not set');
const CLIENT_URL = process.env.CLIENT_URL;

const origin = [CLIENT_URL];
if (process.env.NODE_ENV === 'development') {
  origin.push('http://127.0.0.1:8080');
}

export function createRouter(ctx: AppContext): RequestListener {
  const router = express();

  router.use(
    cors({
      origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  router.use(express.json());

  // OAuth metadata
  router.get(
    '/oauth-client-metadata.json',
    handler((req, res) => {
      res.setHeader('cache-control', `max-age=${MAX_AGE}, public`);
      res.json(ctx.oauthClient.clientMetadata);
    }),
  );

  // Public keys
  router.get(
    '/.well-known/jwks.json',
    handler((req, res) => {
      res.setHeader('cache-control', `max-age=${MAX_AGE}, public`);
      res.json(ctx.oauthClient.jwks);
    }),
  );

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

  router.use('/auth', createAuthRouter(ctx));

  return router;
}
