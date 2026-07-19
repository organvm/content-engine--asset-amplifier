import { pgTable, uuid, text, timestamp, real, integer, jsonb, vector } from 'drizzle-orm/pg-core';
import { brands } from './brands.js';

export const naturalCenters = pgTable('natural_centers', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand_id: uuid('brand_id').unique().notNull().references(() => brands.id),
  version: integer('version').notNull().default(1),
  thematic_core: jsonb('thematic_core').notNull(),
  aesthetic_signature: jsonb('aesthetic_signature').notNull(),
  tonal_vector: jsonb('tonal_vector').notNull(),
  narrative_bias: jsonb('narrative_bias').notNull(),
  symbolic_markers: jsonb('symbolic_markers').notNull(),
  negative_space: jsonb('negative_space').notNull(),
  brand_embedding: vector('brand_embedding', { dimensions: 1536 }).notNull(),
  confidence_scores: jsonb('confidence_scores').notNull(),
  overall_confidence: real('overall_confidence').notNull(),
  source_asset_ids: jsonb('source_asset_ids').notNull(),
  system_prompt: text('system_prompt').notNull(),
  inquiries: jsonb('inquiries').default('[]'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
