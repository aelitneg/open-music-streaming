import fp from 'fastify-plugin';
import { and, eq } from 'drizzle-orm';
import { TID } from '@atproto/common-web';
import { requireAuth } from '../plugins/session.js';
import { albums, artists } from '../db/schema.js';
import { ARTIST_COLLECTION, ALBUM_COLLECTION } from '../lib/collections.js';

export default fp(async (app) => {
  app.get(
    '/artists/:artistRkey/albums',
    { preHandler: requireAuth },
    async (request) => {
      const { artistRkey } = request.params as { artistRkey: string };
      const { did } = request.session;
      const artistUri = `at://${did}/${ARTIST_COLLECTION}/${artistRkey}`;

      const rows = await app.db
        .select()
        .from(albums)
        .where(eq(albums.artistUri, artistUri));

      return { albums: rows };
    },
  );

  app.post(
    '/artists/:artistRkey/albums',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { artistRkey } = request.params as { artistRkey: string };
      const { title } = request.body as { title?: unknown };

      if (typeof title !== 'string' || title.trim().length === 0) {
        return reply.status(400).send({ error: 'title is required' });
      }

      const { did } = request.session;
      const artistUri = `at://${did}/${ARTIST_COLLECTION}/${artistRkey}`;
      const trimmedTitle = title.trim();

      const [artist] = await app.db
        .select()
        .from(artists)
        .where(and(eq(artists.uri, artistUri), eq(artists.did, did)))
        .limit(1);

      if (!artist) {
        return reply.status(404).send({ error: 'artist not found' });
      }

      const rkey = TID.nextStr();
      const createdAt = new Date().toISOString();

      // TODO: putRecord + DB write should be a single transaction with compensation on failure.
      const result = await request.agent.com.atproto.repo.putRecord({
        repo: did,
        collection: ALBUM_COLLECTION,
        rkey,
        record: {
          $type: ALBUM_COLLECTION,
          did,
          artist: artistUri,
          title: trimmedTitle,
          createdAt,
        },
        validate: false,
      });

      const uri = result.data.uri;

      await app.db
        .insert(albums)
        .values({ uri, did, artistUri, title: trimmedTitle, createdAt });

      return reply
        .status(201)
        .send({ uri, did, artistUri, title: trimmedTitle, createdAt });
    },
  );

  app.patch(
    '/artists/:artistRkey/albums/:albumRkey',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { artistRkey, albumRkey } = request.params as {
        artistRkey: string;
        albumRkey: string;
      };
      const { title } = request.body as { title?: unknown };

      if (typeof title !== 'string' || title.trim().length === 0) {
        return reply.status(400).send({ error: 'title is required' });
      }

      const { did } = request.session;
      const uri = `at://${did}/${ALBUM_COLLECTION}/${albumRkey}`;
      const artistUri = `at://${did}/${ARTIST_COLLECTION}/${artistRkey}`;
      const trimmedTitle = title.trim();

      const [existing] = await app.db
        .select()
        .from(albums)
        .where(and(eq(albums.uri, uri), eq(albums.did, did)))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: 'album not found' });
      }

      // TODO: putRecord + DB write should be a single transaction with compensation on failure.
      await request.agent.com.atproto.repo.putRecord({
        repo: did,
        collection: ALBUM_COLLECTION,
        rkey: albumRkey,
        record: {
          $type: ALBUM_COLLECTION,
          did,
          artist: artistUri,
          title: trimmedTitle,
          createdAt: existing.createdAt,
        },
        validate: false,
      });

      await app.db
        .update(albums)
        .set({ title: trimmedTitle })
        .where(eq(albums.uri, uri));

      return { ...existing, title: trimmedTitle };
    },
  );
});
