import { pgTable, uuid, text, timestamp, real } from 'drizzle-orm/pg-core';
import { agencies } from './agencies.js';

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  agency_id: uuid('agency_id').references(() => agencies.id),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  brand_guidelines_url: text('brand_guidelines_url'),
  tone_description: text('tone_description'),
  consistency_threshold: real('consistency_threshold').notNull().default(0.75),
  status: text('status').notNull().default('active'),
  stripe_customer_id: text('stripe_customer_id'),
  subscription_tier: text('subscription_tier'),
  subscription_status: text('subscription_status'),
  subscription_id: text('subscription_id'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
