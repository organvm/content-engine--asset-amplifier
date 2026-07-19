import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { brands } from './brands.js';
import { assets } from './assets.js';

export const artworkProjects = pgTable('artwork_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand_id: uuid('brand_id').notNull().references(() => brands.id),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  status: text('status').notNull().default('draft'),
  project_type: text('project_type').notNull().default('artwork'),
  hero_asset_id: uuid('hero_asset_id').references(() => assets.id),
  source_asset_ids: jsonb('source_asset_ids').notNull().default('[]'),
  canonical_url: text('canonical_url'),
  linked_application_id: uuid('linked_application_id'),
  hashtag_title: jsonb('hashtag_title').notNull().default('[]'),
  keywords: jsonb('keywords').notNull().default('[]'),
  influences: jsonb('influences').notNull().default('[]'),
  canonical_essay: text('canonical_essay'),
  artist_statement: text('artist_statement'),
  process_note: text('process_note'),
  credits: jsonb('credits').notNull().default('[]'),
  rights: text('rights'),
  metadata: jsonb('metadata').notNull().default('{}'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
