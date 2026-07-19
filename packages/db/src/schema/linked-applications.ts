import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { artworkProjects } from './artwork-projects.js';

export const linkedApplications = pgTable('linked_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => artworkProjects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  type: text('type').notNull().default('other'),
  cta_label: text('cta_label').notNull(),
  health_status: text('health_status').notNull().default('unknown'),
  privacy: text('privacy').notNull().default('public'),
  tracking_enabled: boolean('tracking_enabled').notNull().default(false),
  campaign_key: text('campaign_key'),
  allowed_events: jsonb('allowed_events').notNull().default('[]'),
  last_health_check: timestamp('last_health_check', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
