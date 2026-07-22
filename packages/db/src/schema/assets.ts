import { pgTable, uuid, text, timestamp, real, integer, bigint, jsonb } from 'drizzle-orm/pg-core';
import { brands } from './brands.js';

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand_id: uuid('brand_id').notNull().references(() => brands.id),
  media_type: text('media_type').notNull(),
  original_filename: text('original_filename').notNull(),
  storage_key: text('storage_key').notNull(),
  file_size_bytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  duration_seconds: real('duration_seconds'),
  width: integer('width'),
  height: integer('height'),
  transcription: text('transcription'),
  processing_status: text('processing_status').notNull().default('uploaded'),
  fragment_count: integer('fragment_count').default(0),
  rendered_video_key: text('rendered_video_key'),
  metadata: jsonb('metadata').default('{}'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
