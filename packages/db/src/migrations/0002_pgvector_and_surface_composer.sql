-- Migration 0002: pgvector upgrade + Surface Composer tables
-- Issues: #12 (pgvector), #35 (Surface Composer Phase 0)

-- ============================================================================
-- #12: Convert brand_embedding from TEXT to vector(1536)
-- The vector extension is already created in 0001_initial.sql.
-- We rebuild the column with a cast. Existing TEXT data must be convertible
-- to vector format (JSON array of floats). If existing rows contain non-vector
-- text, they must be cleaned before running this migration.
-- ============================================================================

-- Add a new vector column
ALTER TABLE natural_centers
  ADD COLUMN brand_embedding_vec vector(1536);

-- Copy existing TEXT data cast to vector (requires valid JSON float array)
UPDATE natural_centers
  SET brand_embedding_vec = brand_embedding::vector;

-- Drop the old TEXT column and rename the new one
ALTER TABLE natural_centers DROP COLUMN brand_embedding;
ALTER TABLE natural_centers RENAME COLUMN brand_embedding_vec TO brand_embedding;

-- Recreate the unique constraint (dropped with column)
ALTER TABLE natural_centers
  ALTER COLUMN brand_embedding SET NOT NULL;

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX idx_natural_centers_embedding
  ON natural_centers USING hnsw (brand_embedding vector_cosine_ops);

-- ============================================================================
-- #35: Surface Composer tables
-- ============================================================================

-- artwork_projects: first-class editorial project object
CREATE TABLE artwork_projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  slug                  TEXT NOT NULL,
  title                 TEXT NOT NULL,
  subtitle              TEXT,
  status                TEXT NOT NULL DEFAULT 'draft',
  project_type          TEXT NOT NULL DEFAULT 'artwork',
  hero_asset_id         UUID REFERENCES assets(id),
  source_asset_ids      JSONB NOT NULL DEFAULT '[]',
  canonical_url         TEXT,
  linked_application_id UUID,
  hashtag_title         JSONB NOT NULL DEFAULT '[]',
  keywords              JSONB NOT NULL DEFAULT '[]',
  influences            JSONB NOT NULL DEFAULT '[]',
  canonical_essay       TEXT,
  artist_statement      TEXT,
  process_note          TEXT,
  credits               JSONB NOT NULL DEFAULT '[]',
  rights                TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_artwork_projects_brand_slug
  ON artwork_projects(brand_id, slug);

CREATE INDEX idx_artwork_projects_status ON artwork_projects(status);

-- linked_applications: external instrument/app attached to a project
CREATE TABLE linked_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES artwork_projects(id) ON DELETE CASCADE,
  url                 TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'other',
  cta_label           TEXT NOT NULL,
  health_status       TEXT NOT NULL DEFAULT 'unknown',
  privacy             TEXT NOT NULL DEFAULT 'public',
  tracking_enabled    BOOLEAN NOT NULL DEFAULT false,
  campaign_key        TEXT,
  allowed_events      JSONB NOT NULL DEFAULT '[]',
  last_health_check   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_linked_applications_project_id ON linked_applications(project_id);

-- publication_variants: platform-native publication tied to a project
CREATE TABLE publication_variants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES artwork_projects(id) ON DELETE CASCADE,
  content_unit_id     UUID REFERENCES content_units(id) ON DELETE SET NULL,
  platform            TEXT NOT NULL,
  format              TEXT NOT NULL DEFAULT 'single',
  editorial_role      TEXT NOT NULL DEFAULT 'seed',
  caption             TEXT NOT NULL,
  alt_text            TEXT,
  headline            TEXT,
  cta_label           TEXT,
  destination_url     TEXT,
  asset_ids           JSONB NOT NULL DEFAULT '[]',
  approval_status     TEXT NOT NULL DEFAULT 'pending',
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_publication_variants_project_id ON publication_variants(project_id);
CREATE INDEX idx_publication_variants_platform ON publication_variants(platform);
CREATE INDEX idx_publication_variants_approval ON publication_variants(approval_status);

-- conversion_events: privacy-preserving funnel events
CREATE TABLE conversion_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES artwork_projects(id) ON DELETE CASCADE,
  publish_event_id      UUID REFERENCES publish_events(id) ON DELETE SET NULL,
  anonymous_session_id  TEXT NOT NULL,
  event_type            TEXT NOT NULL,
  source                TEXT,
  medium                TEXT,
  campaign              TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}',
  occurred_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversion_events_project_id ON conversion_events(project_id);
CREATE INDEX idx_conversion_events_event_type ON conversion_events(event_type);
CREATE INDEX idx_conversion_events_occurred ON conversion_events(occurred_at);
