import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { artworkProjects } from './artwork-projects.js';
import { contentUnits } from './content-units.js';

export const publicationVariants = pgTable('publication_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => artworkProjects.id, { onDelete: 'cascade' }),
  content_unit_id: uuid('content_unit_id').references(() => contentUnits.id, { onDelete: 'set null' }),
  platform: text('platform').notNull(),
  format: text('format').notNull().default('single'),
  editorial_role: text('editorial_role').notNull().default('seed'),
  caption: text('caption').notNull(),
  alt_text: text('alt_text'),
  headline: text('headline'),
  cta_label: text('cta_label'),
  destination_url: text('destination_url'),
  asset_ids: jsonb('asset_ids').notNull().default('[]'),
  approval_status: text('approval_status').notNull().default('pending'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
