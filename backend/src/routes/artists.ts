import fp from 'fastify-plugin';
import { and, eq } from 'drizzle-orm';
import { TID } from '@atproto/common-web';
import { requireAuth } from '../plugins/session.js';
import { artists } from '../db/schema.js';
import { ARTIST_COLLECTION as COLLECTION } from '../lib/collections.js';
import { isUniqueViolation } from '../lib/db.js';

export default fp(async (app) => {
  app.get('/artists', { preHandler: requireAuth }, async (request) => {
    const rows = await app.db
      .select()
      .from(artists)
      .where(eq(artists.did, request.session.did));
    return { artists: rows };
  });

  app.post('/artists', { preHandler: requireAuth }, async (request, reply) => {
    const { name } = (request.body as { name?: unknown }) ?? {};

    if (typeof name !== 'string' || name.trim().length === 0) {
      return reply.status(400).send({ error: 'name is required' });
    }

    const { did } = request.session;
    const trimmedName = name.trim();

    const [existing] = await app.db
      .select()
      .from(artists)
      .where(and(eq(artists.did, did), eq(artists.name, trimmedName)))
      .limit(1);

    if (existing) {
      return reply.status(409).send({ error: 'artist name already exists' });
    }

    const rkey = TID.nextStr();
    const createdAt = new Date().toISOString();

    // TODO: putRecord + DB write should be a single transaction with compensation on failure.
    const result = await request.agent.com.atproto.repo.putRecord({
      repo: did,
      collection: COLLECTION,
      rkey,
      record: { $type: COLLECTION, did, name: trimmedName, createdAt },
      validate: false,
    });

    const uri = result.data.uri;

    try {
      await app.db
        .insert(artists)
        .values({ uri, did, name: trimmedName, createdAt });
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        return reply.status(409).send({ error: 'artist name already exists' });
      }
      throw err;
    }

    return reply.status(201).send({ uri, did, name: trimmedName, createdAt });
  });

  app.patch(
    '/artists/:rkey',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { rkey } = request.params as { rkey: string };
      const { name } = (request.body as { name?: unknown }) ?? {};

      if (typeof name !== 'string' || name.trim().length === 0) {
        return reply.status(400).send({ error: 'name is required' });
      }

      const { did } = request.session;
      const uri = `at://${did}/${COLLECTION}/${rkey}`;
      const trimmedName = name.trim();

      const [existing] = await app.db
        .select()
        .from(artists)
        .where(and(eq(artists.uri, uri), eq(artists.did, did)))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: 'artist not found' });
      }

      const [conflict] = await app.db
        .select()
        .from(artists)
        .where(and(eq(artists.did, did), eq(artists.name, trimmedName)))
        .limit(1);

      if (conflict) {
        return reply.status(409).send({ error: 'artist name already exists' });
      }

      // TODO: putRecord + DB write should be a single transaction with compensation on failure.
      await request.agent.com.atproto.repo.putRecord({
        repo: did,
        collection: COLLECTION,
        rkey,
        record: {
          $type: COLLECTION,
          did,
          name: trimmedName,
          createdAt: existing.createdAt,
        },
        validate: false,
      });

      await app.db
        .update(artists)
        .set({ name: trimmedName })
        .where(eq(artists.uri, uri));

      return { ...existing, name: trimmedName };
    },
  );
});
