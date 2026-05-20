import { pgTable, text } from 'drizzle-orm/pg-core';

export const authSession = pgTable('auth_session', {
  key: text('key').primaryKey(),
  session: text('session').notNull(),
});

export const authState = pgTable('auth_state', {
  key: text('key').primaryKey(),
  state: text('state').notNull(),
});
