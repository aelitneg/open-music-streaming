import fp from 'fastify-plugin';
import { and, eq } from 'drizzle-orm';
import { TID } from '@atproto/common-web';
import { requireAuth } from '../plugins/session.js';
import { albums, songs } from '../db/schema.js';
import {
  ARTIST_COLLECTION,
  ALBUM_COLLECTION,
  SONG_COLLECTION,
} from '../lib/collections.js';
import { isUniqueViolation } from '../lib/db.js';

export default fp(async (app) => {
  app.get(
    '/artists/:artistRkey/albums/:albumRkey/songs',
    { preHandler: requireAuth },
    async (request) => {
      const { albumRkey } = request.params as {
        artistRkey: string;
        albumRkey: string;
      };
      const { did } = request.session;
      const albumUri = `at://${did}/${ALBUM_COLLECTION}/${albumRkey}`;

      const rows = await app.db
        .select()
        .from(songs)
        .where(eq(songs.albumUri, albumUri));

      return { songs: rows };
    },
  );

  app.post(
    '/artists/:artistRkey/albums/:albumRkey/songs',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { artistRkey, albumRkey } = request.params as {
        artistRkey: string;
        albumRkey: string;
      };

      const { did } = request.session;
      const artistUri = `at://${did}/${ARTIST_COLLECTION}/${artistRkey}`;
      const albumUri = `at://${did}/${ALBUM_COLLECTION}/${albumRkey}`;

      let title: string | undefined;
      let audioBuffer: Buffer | undefined;
      let audioMimeType: string | undefined;

      for await (const part of request.parts()) {
        if (part.type === 'field' && part.fieldname === 'title') {
          title = part.value as string;
        } else if (part.type === 'file' && part.fieldname === 'audio') {
          audioMimeType = part.mimetype;
          audioBuffer = await part.toBuffer();
        }
      }

      if (typeof title !== 'string' || title.trim().length === 0) {
        return reply.status(400).send({ error: 'title is required' });
      }

      if (!audioBuffer || !audioMimeType) {
        return reply.status(400).send({ error: 'audio file is required' });
      }

      const trimmedTitle = title.trim();

      const [album] = await app.db
        .select()
        .from(albums)
        .where(and(eq(albums.uri, albumUri), eq(albums.did, did)))
        .limit(1);

      if (!album) {
        return reply.status(404).send({ error: 'album not found' });
      }

      const [existing] = await app.db
        .select()
        .from(songs)
        .where(
          and(
            eq(songs.did, did),
            eq(songs.artistUri, artistUri),
            eq(songs.albumUri, albumUri),
            eq(songs.title, trimmedTitle),
          ),
        )
        .limit(1);

      if (existing) {
        return reply.status(409).send({ error: 'song title already exists' });
      }

      const blobResult = await request.agent.com.atproto.repo.uploadBlob(
        audioBuffer,
        { encoding: audioMimeType },
      );

      const audioCid = blobResult.data.blob.ref.toString();

      const rkey = TID.nextStr();
      const createdAt = new Date().toISOString();

      // TODO: putRecord + DB write should be a single transaction with compensation on failure.
      const result = await request.agent.com.atproto.repo.putRecord({
        repo: did,
        collection: SONG_COLLECTION,
        rkey,
        record: {
          $type: SONG_COLLECTION,
          did,
          artist: artistUri,
          album: albumUri,
          title: trimmedTitle,
          audio: blobResult.data.blob,
          createdAt,
        },
        validate: false,
      });

      const uri = result.data.uri;

      try {
        await app.db.insert(songs).values({
          uri,
          did,
          artistUri,
          albumUri,
          title: trimmedTitle,
          audioCid,
          audioMimeType,
          createdAt,
        });
      } catch (err: unknown) {
        if (isUniqueViolation(err)) {
          return reply.status(409).send({ error: 'song title already exists' });
        }
        throw err;
      }

      return reply.status(201).send({
        uri,
        did,
        artistUri,
        albumUri,
        title: trimmedTitle,
        audioCid,
        audioMimeType,
        createdAt,
      });
    },
  );

  app.patch(
    '/artists/:artistRkey/albums/:albumRkey/songs/:songRkey',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { artistRkey, albumRkey, songRkey } = request.params as {
        artistRkey: string;
        albumRkey: string;
        songRkey: string;
      };

      const { did } = request.session;
      const uri = `at://${did}/${SONG_COLLECTION}/${songRkey}`;
      const artistUri = `at://${did}/${ARTIST_COLLECTION}/${artistRkey}`;
      const albumUri = `at://${did}/${ALBUM_COLLECTION}/${albumRkey}`;

      let title: string | undefined;
      let audioBuffer: Buffer | undefined;
      let audioMimeType: string | undefined;

      for await (const part of request.parts()) {
        if (part.type === 'field' && part.fieldname === 'title') {
          title = part.value as string;
        } else if (part.type === 'file' && part.fieldname === 'audio') {
          audioMimeType = part.mimetype;
          audioBuffer = await part.toBuffer();
        }
      }

      if (title !== undefined && title.trim().length === 0) {
        return reply
          .status(400)
          .send({ error: 'title must be a non-empty string' });
      }

      if (title === undefined && !audioBuffer) {
        return reply.status(400).send({ error: 'title or audio is required' });
      }

      const trimmedTitle = title?.trim();

      const [existing] = await app.db
        .select()
        .from(songs)
        .where(and(eq(songs.uri, uri), eq(songs.did, did)))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: 'song not found' });
      }

      if (trimmedTitle !== undefined) {
        const [conflict] = await app.db
          .select()
          .from(songs)
          .where(
            and(
              eq(songs.did, did),
              eq(songs.artistUri, artistUri),
              eq(songs.albumUri, albumUri),
              eq(songs.title, trimmedTitle),
            ),
          )
          .limit(1);

        if (conflict) {
          return reply.status(409).send({ error: 'song title already exists' });
        }
      }

      let newAudioCid: string | undefined;
      let newAudioMimeType: string | undefined;
      let audioBlob: unknown;

      if (audioBuffer && audioMimeType) {
        const blobResult = await request.agent.com.atproto.repo.uploadBlob(
          audioBuffer,
          { encoding: audioMimeType },
        );
        newAudioCid = blobResult.data.blob.ref.toString();
        newAudioMimeType = audioMimeType;
        audioBlob = blobResult.data.blob;
      } else {
        audioBlob = {
          $type: 'blob',
          ref: { $link: existing.audioCid },
          mimeType: existing.audioMimeType,
          size: 0,
        };
      }

      // TODO: putRecord + DB write should be a single transaction with compensation on failure.
      await request.agent.com.atproto.repo.putRecord({
        repo: did,
        collection: SONG_COLLECTION,
        rkey: songRkey,
        record: {
          $type: SONG_COLLECTION,
          did,
          artist: artistUri,
          album: albumUri,
          title: trimmedTitle ?? existing.title,
          audio: audioBlob,
          createdAt: existing.createdAt,
        },
        validate: false,
      });

      const updateSet: Partial<{
        title: string;
        audioCid: string;
        audioMimeType: string;
      }> = {};
      if (trimmedTitle !== undefined) updateSet.title = trimmedTitle;
      if (newAudioCid !== undefined) {
        updateSet.audioCid = newAudioCid;
        updateSet.audioMimeType = newAudioMimeType;
      }

      await app.db.update(songs).set(updateSet).where(eq(songs.uri, uri));

      return {
        ...existing,
        title: trimmedTitle ?? existing.title,
        audioCid: newAudioCid ?? existing.audioCid,
        audioMimeType: newAudioMimeType ?? existing.audioMimeType,
      };
    },
  );
});
