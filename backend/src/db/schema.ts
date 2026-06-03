import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const authSession = pgTable('auth_session', {
  key: text('key').primaryKey(),
  session: text('session').notNull(),
});

export const authState = pgTable('auth_state', {
  key: text('key').primaryKey(),
  state: text('state').notNull(),
});

export const users = pgTable('users', {
  did: text('did').primaryKey(),
  handle: text('handle').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const artists = pgTable('artists', {
  uri: text('uri').primaryKey(),
  did: text('did').notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  indexedAt: timestamp('indexed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const albums = pgTable('albums', {
  uri: text('uri').primaryKey(),
  did: text('did').notNull(),
  artistUri: text('artist_uri').notNull(),
  title: text('title').notNull(),
  createdAt: text('created_at').notNull(),
  indexedAt: timestamp('indexed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const songs = pgTable('songs', {
  uri: text('uri').primaryKey(),
  did: text('did').notNull(),
  artistUri: text('artist_uri').notNull(),
  albumUri: text('album_uri').notNull(),
  title: text('title').notNull(),
  audioCid: text('audio_cid').notNull(),
  audioMimeType: text('audio_mime_type').notNull(),
  createdAt: text('created_at').notNull(),
  indexedAt: timestamp('indexed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
