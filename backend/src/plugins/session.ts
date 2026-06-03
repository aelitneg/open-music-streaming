import fp from 'fastify-plugin';
import { getIronSession, type IronSession } from 'iron-session';
import { Agent } from '@atproto/api';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type Session = { did: string; handle: string };

const COOKIE_SECRET = process.env.COOKIE_SECRET;
if (!COOKIE_SECRET) throw new Error('COOKIE_SECRET is not set');

const sessionOptions = {
  cookieName: 'sid',
  password: COOKIE_SECRET,
};

declare module 'fastify' {
  interface FastifyRequest {
    session: IronSession<Session>;
    agent: Agent;
  }
}

// Prehandler for routes that require an authenticated AT Proto agent.
// Checks the session, restores the OAuth session, and attaches the agent
// to the request. Returns 401 if either is missing.
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.session.did) {
    await reply.status(401).send({ error: 'not authenticated' });
    return;
  }
  const oauthSession = await request.server.oauthClient.restore(
    request.session.did,
  );
  if (!oauthSession) {
    request.session.destroy();
    await reply
      .status(401)
      .send({ error: 'session expired, please sign in again' });
    return;
  }
  request.agent = new Agent(oauthSession);
}

export default fp(async (app) => {
  app.decorateRequest('session', null as unknown as IronSession<Session>);
  app.decorateRequest('agent', null as unknown as Agent);

  app.addHook('onRequest', async (request, reply) => {
    request.session = await getIronSession<Session>(
      request.raw,
      reply.raw,
      sessionOptions,
    );
  });
});
