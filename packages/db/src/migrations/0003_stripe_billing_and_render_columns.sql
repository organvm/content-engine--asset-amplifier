-- Migration 0003: Stripe billing + video-render columns
-- Reconciles columns present in the Drizzle schema (packages/db/src/schema/*)
-- but missing from 0001/0002, so a DB provisioned from migrations matches code.

-- Billing / subscription state (brands) — written by src/billing-handler.ts,
-- keyed to Stripe tiers 'creator' / 'studio'.
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS stripe_customer_id  text,
  ADD COLUMN IF NOT EXISTS subscription_tier   text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS subscription_id     text;

-- Rendered b-roll R2 key (assets) — written by the render-video processor.
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS rendered_video_key text;

-- Clarification inquiries (natural_centers) — emitted during NC derivation.
ALTER TABLE natural_centers
  ADD COLUMN IF NOT EXISTS inquiries jsonb DEFAULT '[]';
