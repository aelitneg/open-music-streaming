import assert from 'node:assert';
import { RequestListener } from 'node:http';
import express from 'express';
import { isValidHandle } from '@atproto/syntax';
import { getIronSession } from 'iron-session';
import type { AppContext } from '@/context';
import { handler } from '@/lib/http';

type Session = { did: string };

assert(process.env.COOKIE_SECRET, 'COOKIE_SECRET is not set');
const COOKIE_SECRET = process.env.COOKIE_SECRET;

export function createAuthRouter(ctx: AppContext): RequestListener {
  const router = express();

  router.post(
    '/login',
    handler(async (req, res) => {
      const handle = req.body?.handle;

      if (typeof handle !== 'string' || !isValidHandle(handle)) {
        return res.status(400).json({ message: 'invalid handle' });
      }

      try {
        const url = await ctx.oauthClient.authorize(handle, {
          scope: 'atproto transition:generic',
        });

        return res.json({ url });
      } catch (error: unknown) {
        console.error(error, 'oauth authorize failed');
        return res.status(500).json({
          error:
            error instanceof Error ? error.message : 'Failed to initiate login',
        });
      }
    }),
  );

  router.post(
    '/oauth/callback',
    handler(async (req, res) => {
      const { state, iss, code } = req.body;
      if (!state || !iss || !code) {
        return res.status(400).json({ message: 'invalid state, iss, or code' });
      }

      try {
        const params = new URLSearchParams({ state, iss, code });
        const { session } = await ctx.oauthClient.callback(params);

        const clientSession = await getIronSession<Session>(req, res, {
          cookieName: 'sid',
          password: COOKIE_SECRET,
        });

        assert(!clientSession.did, 'session already exists');
        clientSession.did = session.did;
        await clientSession.save();

        return res.status(200).json({
          authenticated: true,
          did: session.did,
        });
      } catch (error) {
        console.error(error, 'oauth callback failed');
      }
    }),
  );

  router.get(
    '/session',
    handler(async (req, res) => {
      const session = await getIronSession<Session>(req, res, {
        cookieName: 'sid',
        password: COOKIE_SECRET,
      });

      if (!session.did) {
        return res.status(401).json({ authenticated: false });
      }

      return res.json({
        authenticated: true,
        did: session.did,
      });
    }),
  );

  router.post(
    '/logout',
    handler(async (req, res) => {
      const session = await getIronSession<Session>(req, res, {
        cookieName: 'sid',
        password: COOKIE_SECRET,
      });

      session.destroy();

      return res.json({ message: 'logout success' });
    }),
  );

  return router;
}
