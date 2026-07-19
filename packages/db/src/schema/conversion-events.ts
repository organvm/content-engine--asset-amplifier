import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { artworkProjects } from './artwork-projects.js';
import { publishEvents } from './publish-events.js';

export const conversionEvents = pgTable('conversion_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => artworkProjects.id, { onDelete: 'cascade' }),
  publish_event_id: uuid('publish_event_id').references(() => publishEvents.id, { onDelete: 'set null' }),
  anonymous_session_id: text('anonymous_session_id').notNull(),
  event_type: text('event_type').notNull(),
  source: text('source'),
  medium: text('medium'),
  campaign: text('campaign'),
  metadata: jsonb('metadata').notNull().default('{}'),
  occurred_at: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});
