# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Cronus Metabolus** (formerly Content Engine — Asset Amplifier) is an AI-powered content yield engine. It ingests one premium asset (hero film, 3D render, product shoot), fragments it (clips, stills, captions), and synthesizes 30+ days of platform-optimized social posts. Partnership: Padavano (engineering) + Lefler Design (UI/UX, marketing, sales). Organ III (Ergon — Commerce). MVP operational; deploy configs exist for Cloudflare, Railway, Render, and Vercel (see Live Deployments).

## Live Deployments

Recorded status is **LOCAL** (see auto-generated System Context). The URLs below are local dev endpoints — production URLs are not recorded in this file.

| Component | Local endpoint / Identifier |
|-----------|------------------|
| API — Cloudflare Worker (`worker.ts`) / Fastify (`server.ts`) | http://localhost:3000 |
| Dashboard (Vite SPA) | http://localhost:5173 |
| Pitch Decks | https://organvm.github.io/content-engine--asset-amplifier |
| Database | Neon `green-art-84790526` (PostgreSQL 17 + pgvector) |
| R2 bucket | `cronus-assets` |
| Issues | [organvm-iii-ergon/content-engine--asset-amplifier/issues](https://github.com/organvm-iii-ergon/content-engine--asset-amplifier/issues) |
| Project Board | [Operating Board](https://github.com/orgs/organvm-iii-ergon/projects/6) |

**Deploy targets** (configs live in the repo; workflows in `.github/workflows/`):

- **Cloudflare Worker** — API production surface (`apps/api` + `wrangler.toml`); `deploy-api.yml` on push to `main` touching `apps/api/**`, `packages/**`, `services/**`.
- **Cloudflare Pages** — Dashboard (`deploy-dashboard.yml` → `pages deploy apps/dashboard/dist`).
- **Vercel** — Dashboard SPA (`apps/dashboard/vercel.json`). ⚠️ `apps/dashboard/vite.config.ts` sets `base: '/content-engine--asset-amplifier/dashboard/'` (a GitHub-Pages subpath); override to `/` at build time for correct Vercel/Pages **root** hosting.
- **Railway** (`railway.toml`, nixpacks) & **Render** (`render.yaml`, free/ohio) — both run the **Fastify** `server.ts` (Node), *not* the Worker; Render sets `STORAGE_MODE=filesystem` (no R2).
- **GitHub Pages** — `pitch-deck/` static site (`deploy-pitch-decks.yml`).

## Roadmap (GitHub Issues)

| Phase | Issues |
|-------|--------|
| α (Dashboard) | #6 Asset ROI, #7 Identity Mirror, #8 Brand selector, #9 Content detail |
| β (Platform) | #1 X adapter, #2 TikTok, #3 YouTube, #4 Instagram OAuth, #5 Real publishing |
| γ (Scale) | #13 Agency dashboard, #14 Design resizing |
| infra | #10 CI/CD, #11 BullMQ/Temporal, #12 pgvector migration |

> **Infra status:** #10 (CI in `.github/workflows/ci.yml`), #11 (dual **BullMQ + Temporal** runtimes — see `docs/adr/002-dual-runtime-bullmq-temporal.md`), and #12 (pgvector in migration `0002`, cosine search in `@cronus/scoring`) are all implemented in the tree.

## Repo Layout (pnpm + Turbo monorepo)

Workspace globs in `pnpm-workspace.yaml`: `apps/*`, `services/*`, `packages/*` (note: `infra/` is **not** a workspace — `apps/temporal-worker` imports `infra/temporal/*` by relative path). Node ≥22, pnpm ≥9, ESM throughout (`"type": "module"`).

**Apps** (`apps/*`):

- **`apps/api`** (`@cronus/api`) — REST API. **Three-runtime split** (see Architecture): Cloudflare Worker (prod), Fastify server (full pipeline), plus the two worker processes below that drain its queues.
- **`apps/worker`** (`@cronus/worker`) — long-running **BullMQ** consumer. Registers 6 processors (`asset.process`, `content.generate`, `publish.execute`, `nc.derive`, `analytics.collect`, `render.video`) and co-hosts the scheduler polling loop (`startSchedulerLoop`, 60 s). Needs Redis (`REDIS_URL`).
- **`apps/temporal-worker`** (`temporal-worker`) — **Temporal** worker. Registers 5 workflows + 5 activity groups on task queue `cronus-content-engine`; runs via `tsx` (no build step), bundles workflow code from `infra/temporal/*` at startup. Needs a Temporal server (`TEMPORAL_ADDRESS`, default `localhost:7233`).
- **`apps/dashboard`** (`@cronus/dashboard`) — React 19 + Vite 8 + **Tailwind 4** (`@tailwindcss/postcss`). ⚠️ `package.json` has **no `dev` script** (`build` runs `tsc` only, not `vite build`) — dev-serve with `npx vite`, real bundle with `npx vite build`.
- **`apps/cli`** (`@cronus/cli`) — Commander.js CLI, binary `cronus`. Verbs: `ingest` (parse brainstorm `.md`/`.txt` → Kerygma/ArtworkProject JSON), `manifest` (Surface Composer manifest), `upload` (POST asset to API), `status` (job status). No `dev`/`start` script — run with `npx tsx apps/cli/src/index.ts <verb>`.
- **`apps/mobile`** (`@cronus/mobile`) — React Native 0.76 + Expo 52 MVP (Dashboard + ReviewQueue screens). ⚠️ missing Expo asset files (`assets/icon.png` etc.) so it can't build for production yet.
- **`apps/narcissus-v0`** (`@cronus/narcissus-v0`) — standalone browser prototype (recursive-canvas "infinite mirror", roadmap #7 Identity Mirror). Fully isolated: no `@cronus/*` deps, lints with **oxlint**, no tests.

**Packages** (`packages/*`, all `@cronus/<name>`): `config` (Zod env validation + AI provider resolver + crypto), `db` (Drizzle schema + Neon/postgres-js clients + mappers + migrations + seed), `domain` (types-only: const enums for `ApprovalStatus`/`ProcessingStatus`/`Platform`/…), `logger` (Pino), `queue` (typed BullMQ factories + `JobPayloads`), `storage` (AWS-SDK-v3 S3/R2 wrapper + `FilesystemStorageClient` fallback).

**Services** (`services/*`, 12 total, all `@cronus/<name>`) — **real implementations, not stubs** (a few adapters have partial paths, noted below):

- `asset-ingestion`, `fragment-extraction` (FFmpeg via fluent-ffmpeg + sharp + Whisper), `natural-center` (Claude Vision brand-identity derivation), `content-generation`, `scoring` (embed + cosine vs NC), `scheduler`, `platform-adapter`, `analytics`, `design-resizer` (sharp smart-crop).
- `platform-adapter` registers **5 adapters** for 7 `Platform` values (instagram_feed/story/reels, linkedin, x, tiktok, youtube_shorts) + in-memory `rate-limiter.ts`. ⚠️ YouTube-Shorts publish and LinkedIn media upload are partial/simulated.
- **Node-only, NOT in the `wrangler` alias** (cannot run in the Worker): `audience-engine` (project/essay conversion funnels over `artwork_projects`), `video-renderer` (Remotion b-roll compositing → R2), `webhook-dispatcher` (HMAC-signed campaign event fan-out; reads `SWARM_WEBHOOK_URLS`).

**Infra** (`infra/*`): `docker` (full local stack — see Commands), `temporal` (**live** workflow + activity source, imported by `apps/temporal-worker`), `scripts` (dev-setup, seed, e2e-demo, healthcheck), `tests` (E2E integration, run with a dedicated vitest config). Architecture decisions in `docs/adr/` — **ADR-001 (BullMQ-only) is superseded by ADR-002 (dual runtime)**.

## Architecture: Three Runtimes

`apps/api` ships as **two API surfaces that are not feature-equivalent**, plus **two async worker processes** that drain its queues. When editing API behavior, **check whether both `server.ts` and `worker.ts` need updating — they drift easily.**

1. **Cloudflare Worker** (`src/worker.ts`, Hono) — canonical production surface. R2 binding for storage, Neon **HTTP** driver for Postgres. **Cannot run FFmpeg / native binaries / BullMQ** — it collapses the fragment-extraction pipeline into one synthetic fragment and calls the LLM directly to mint per-platform `content_units`. Queue/FFmpeg endpoints degrade gracefully (e.g. `render-video` → 202 "render_via_fastify", `/api/v1/jobs/:id` → 501). ⚠️ **The Worker has NO auth middleware** — `API_KEY` is a declared binding but is never enforced; only the Fastify runtime checks it.
2. **Fastify server** (`src/server.ts`) — full-stack/dev runtime with `authPlugin` (`x-api-key` **or** `Authorization: Bearer`, health exempt), postgres-js driver, and ~9 route modules **absent from the Worker**: `projects`, `publication-variants`, `linked-applications`, `conversion-events`, `analytics`, `schedule`, `platforms`, `resize`, `video`. Enqueues BullMQ jobs (e.g. `POST /brands/:id/render-video` → `render.video`). 2 GB multipart limit.
3. **BullMQ worker** (`apps/worker`) + **Temporal worker** (`apps/temporal-worker`) — the async execution layer. Per **ADR-002**, the intended split is: **Temporal** owns durable multi-step flows (asset ingestion, content generation, NC derivation, publishing); **BullMQ** owns lightweight/stateless jobs (analytics collect, design resize, webhook dispatch). The boundary is *decided but not yet enforced* — `apps/worker` currently still runs BullMQ processors for the Temporal-owned concerns too.

Cross-cutting:

- `wrangler.toml`'s `[alias]` block is **load-bearing**: it rewrites every `@cronus/*` import to that package's `src/index.ts` so the Worker bundles without built `dist/`. **When adding a package consumed by the Worker, add an alias entry** — but do **not** alias Node-only services (`audience-engine`, `video-renderer`, `webhook-dispatcher`).
- ⚠️ **Latent Worker incompatibilities:** `fragment-extraction` (FFmpeg) and `design-resizer` (sharp native binary) are aliased into the Worker bundle but cannot actually execute at the edge — any Worker path reaching real extraction/resize would fail at runtime. The real pipeline only runs under Fastify + the worker processes.
- `src/billing-handler.ts` is a **shared Stripe module imported by both runtimes** (Hono uses `c.req.text()` for the raw webhook body; Fastify stashes `req.rawBody` via a content-type parser). It writes `stripe_customer_id` / `subscription_tier` / `subscription_status` / `subscription_id` to `brands`, keyed to tiers `creator`/`studio`. ⚠️ `billing-handler.ts` and `routes/video.ts` are **untracked** in git as of this writing — they won't appear in `git log`.
- The Worker copies all bindings into `process.env` in a global middleware and forces `NODE_ENV=production` (skips the Ollama localhost provider check). Secrets are set with `wrangler secret put`.

## DB Conventions (`packages/db`)

- Drizzle ORM, dialect `postgresql`, schema files in `src/schema/*.ts`, root export `src/schema/index.ts`.
- **Columns are `snake_case` in the DB**; Drizzle insert/update calls use snake_case keys (`brand_id`, `processing_status`, …). Wire format is camelCase via `toCamel`/`mapRows` (`src/mappers.ts`); use **`toSnake`** to convert camelCase inputs back before writes. New routes: snake_case for Drizzle, camelCase for JSON.
- **Two client drivers, same schema:** `src/client.ts` uses `drizzle-orm/postgres-js` (Fastify/CLI/workers); `apps/api/src/worker.ts` uses `drizzle-orm/neon-http` (edge). A schema edit affects both.
- **13 tables** (not 9): `agencies`, `brands`, `natural_centers`, `assets`, `fragments`, `content_units`, `platform_connections`, `publish_events`, `performance_observations`, plus (migration `0002`, "Surface Composer") `artwork_projects`, `publication_variants`, `linked_applications`, `conversion_events`.
- **Migrations** (`src/migrations/`, hand-authored SQL): `0001_initial.sql`, `0002_pgvector_and_surface_composer.sql`, `0003_stripe_billing_and_render_columns.sql` (adds `brands.stripe_customer_id`/`subscription_*`, `assets.rendered_video_key`, `natural_centers.inquiries` — the columns the Drizzle schema carries). Applied by `packages/db/src/migrations` via `pnpm db:migrate` (`src/migrate.ts`). When you add/alter a column in a schema file, **hand-write the next `NNNN_*.sql`** — `drizzle-kit generate` emits a full baseline here (no journal), not an incremental diff.

## Provider Resolution (`packages/config`)

`resolveProviders()` returns the active `llm`, `embedding`, `transcription` providers plus fallback lists. Fallback order (`src/providers.ts`): **Ollama → Groq → Gemini → Cerebras → Cloudflare Workers AI → Anthropic → OpenAI**. Ollama (local) is skipped when `NODE_ENV=production`. Model IDs are hardcoded per class in `providers.ts` (e.g. `AnthropicLLM` → `claude-sonnet-4-5-20250514`, `GroqLLM` → `llama-3.3-70b-versatile`) — update there, not here. The Zod env schema (`src/index.ts`) requires **`ANTHROPIC_API_KEY` unconditionally**; the other AI keys are read directly from `process.env` with `isRealKey()` guards, not validated at startup.

## Key Domain Concepts

- **Metabolism** — break a Hero asset into fragments (clips/stills/text), then re-synthesize per-platform content.
- **Natural Center** — per-brand identity profile derived from approved content, used to score new fragments for brand-fit. Persisted in `natural_centers`; pgvector `brand_embedding vector(1536)`.
- **Approval flow** — `content_units.approval_status ∈ {pending, approved, rejected}`; rejection writes `flagged_reason`.
- **Artwork Projects** — a content-ownership container per brand (`artwork_projects`) grouping assets into a canonical unit with publication variants (`publication_variants`), an optional linked application (`linked_applications`), and a conversion funnel (`conversion_events`). Fastify-only; exposes a `GET /brands/:id/projects/:pid/manifest` endpoint. Served by `audience-engine` + `webhook-dispatcher`.
- **Temporal / BullMQ workflows** — **live, not queued.** Durable multi-step pipelines run on Temporal (`infra/temporal/*` + `apps/temporal-worker`); lightweight jobs on BullMQ (`packages/queue` + `apps/worker`). See ADR-002 for the runtime boundary.

## Commands

```bash
# Workspace (Turbo orchestrated; test/lint/typecheck all dependsOn ^build)
pnpm install
pnpm dev                 # turbo dev — persistent parallel dev (note: dashboard has no dev script, see below)
pnpm build               # turbo build
pnpm test                # turbo test (Vitest)
pnpm lint                # turbo lint
pnpm typecheck           # turbo typecheck (tsc --noEmit)
pnpm format[:check]      # Prettier write / check
pnpm demo                # tsx infra/scripts/e2e-demo.ts — in-process logic demo, no DB/HTTP
pnpm healthcheck         # checks postgres/redis/minio/temporal containers + node/pnpm versions

# Single-package work — use --filter (there is NO `@cronus/api dev` script)
pnpm --filter @cronus/api test
pnpm --filter @cronus/db typecheck

# Single test file / pattern (Vitest)
pnpm --filter @cronus/db test -- src/mappers.test.ts
pnpm --filter @cronus/api test -- -t "brand creation"

# App-specific dev servers
cd apps/api && npx wrangler dev -c wrangler.toml        # Worker (the only live-reload API dev server)
cd apps/dashboard && npx vite                           # dashboard (no `dev` script in package.json)
pnpm --filter @cronus/worker dev                        # BullMQ worker (needs Redis)
pnpm --filter temporal-worker dev                       # Temporal worker (needs Temporal server)

# Database — migrations are HAND-AUTHORED SQL in packages/db/src/migrations/,
# applied in filename order by packages/db/src/migrate.ts (NOT drizzle-kit migrate,
# which needs a meta/_journal.json snapshot this repo does not keep). Set DATABASE_URL.
pnpm db:migrate          # tsx packages/db/src/migrate.ts — applies pending *.sql (idempotent via _migrations table)
pnpm db:seed             # tsx packages/db/src/seed.ts — seeds the default dev dataset
# Drizzle schema is the source of truth; when you add/alter a column, hand-write the
# next NNNN_*.sql to match (drizzle-kit generate emits a full baseline here, not a diff).

# Local infra — docker:up starts SEVEN services (not just Postgres+Redis):
pnpm docker:up           # postgres, redis, minio, temporal, temporal-ui, api, worker
pnpm docker:down
bash infra/scripts/dev-setup.sh                         # one-shot bootstrap (env, containers, pgvector ext, migrate, healthcheck)

# E2E integration tests (separate config; skipped if DATABASE_URL is unset)
npx vitest run --config infra/tests/vitest.config.ts

# Cloudflare Worker (API) deploy + secrets
cd apps/api
npx wrangler deploy -c wrangler.toml
echo "<value>" | npx wrangler secret put <NAME> -c wrangler.toml
```

## Required Env / Secrets

**Worker bindings** (set via `wrangler secret put`): `DATABASE_URL`, `API_KEY`, `ENCRYPTION_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_CREATOR`, `STRIPE_PRICE_ID_STUDIO`, `DASHBOARD_URL`. R2 binding: `ASSETS_BUCKET` → `cronus-assets`. (Billing throws at runtime without **both** `STRIPE_PRICE_ID_*`.)

**Node / worker-process env** (not Worker secrets): `REDIS_URL` (required by `@cronus/queue` at BullMQ worker startup), `TEMPORAL_ADDRESS` (default `localhost:7233`), `TEMPORAL_NAMESPACE` (default `default`), `API_URL` (b-roll URL in the render-video processor), `SWARM_WEBHOOK_URLS` (optional post-publish webhook fan-out), `STORAGE_MODE`/`STORAGE_ENDPOINT`/`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY` (S3/R2; `STORAGE_MODE=filesystem` falls back to disk — `createStorage()` does this **silently** if S3 vars are absent), `OLLAMA_HOST`/`OLLAMA_MODEL`/`OLLAMA_EMBED_MODEL` (local provider). For local Fastify dev, mirror the relevant names in a `.env`.

## Partnership Context

Full partnership details and evolution in:
`docs/genesis-project/conversations/`

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-III (Commerce) | **Tier:** standard | **Status:** LOCAL
**Org:** `organvm-iii-ergon` | **Repo:** `content-engine--asset-amplifier`

### Edges
- **Produces** → `brands, agencies, dtc-marketing-teams`: service

### Siblings in Commerce
`classroom-rpg-aetheria`, `gamified-coach-interface`, `trade-perpetual-future`, `fetch-familiar-friends`, `sovereign-ecosystem--real-estate-luxury`, `public-record-data-scrapper`, `search-local--happy-hour`, `multi-camera--livestream--framework`, `universal-mail--automation`, `mirror-mirror`, `the-invisible-ledger`, `enterprise-plugin`, `virgil-training-overlay`, `tab-bookmark-manager`, `a-i-chat--exporter` ... and 16 more

### Governance
- Strictly unidirectional flow: I→II→III. No dependencies on Theory (I).

*Last synced: 2026-04-14T21:31:56Z*

## Active Handoff Protocol

If `.conductor/active-handoff.md` exists, **READ IT FIRST** before doing any work.
It contains constraints, locked files, conventions, and completed work from the
originating agent. You MUST honor all constraints listed there.

If the handoff says "CROSS-VERIFICATION REQUIRED", your self-assessment will
NOT be trusted. A different agent will verify your output against these constraints.

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## System Library

Plans: 269 indexed | Chains: 5 available | SOPs: 121 active
Discover: `organvm plans search <query>` | `organvm chains list` | `organvm sop lifecycle`
Library: `meta-organvm/praxis-perpetua/library/`


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | atomic-clock | The Atomic Clock |
| system | any | execution-sequence | Execution Sequence |
| system | any | multi-agent-dispatch | Multi-Agent Dispatch |
| system | any | session-handoff-avalanche | Session Handoff Avalanche |
| system | any | system-loops | System Loops |
| system | any | prompting-standards | Prompting Standards |
| system | any | research-standards-bibliography | APPENDIX: Research Standards Bibliography |
| system | any | phase-closing-and-forward-plan | METADOC: Phase-Closing Commemoration & Forward Attack Plan |
| system | any | research-standards | METADOC: Architectural Typology & Research Standards |
| system | any | sop-ecosystem | METADOC: SOP Ecosystem — Taxonomy, Inventory & Coverage |
| system | foundation | agent-seeding-and-workforce-planning | agent-seeding-and-workforce-planning |
| system | foundation | architecture-decision-records | architecture-decision-records |
| system | any | autonomous-content-syndication | SOP: Autonomous Content Syndication (The Broadcast Protocol) |
| system | any | autopoietic-systems-diagnostics | SOP: Autopoietic Systems Diagnostics (The Mirror of Eternity) |
| system | any | background-task-resilience | background-task-resilience |
| system | any | cicd-resilience-and-recovery | SOP: CI/CD Pipeline Resilience & Recovery |
| system | any | community-event-facilitation | SOP: Community Event Facilitation (The Dialectic Crucible) |
| system | any | context-window-conservation | context-window-conservation |
| system | any | conversation-to-content-pipeline | SOP — Conversation-to-Content Pipeline |
| system | any | cross-agent-handoff | SOP: Cross-Agent Session Handoff |
| system | any | cross-channel-publishing-metrics | SOP: Cross-Channel Publishing Metrics (The Echo Protocol) |
| system | any | data-migration-and-backup | SOP: Data Migration and Backup Protocol (The Memory Vault) |
| system | any | document-audit-feature-extraction | SOP: Document Audit & Feature Extraction |
| system | any | dynamic-lens-assembly | SOP: Dynamic Lens Assembly |
| system | any | essay-publishing-and-distribution | SOP: Essay Publishing & Distribution |
| system | any | formal-methods-applied-protocols | SOP: Formal Methods Applied Protocols |
| system | any | formal-methods-master-taxonomy | SOP: Formal Methods Master Taxonomy (The Blueprint of Proof) |
| system | any | formal-methods-tla-pluscal | SOP: Formal Methods — TLA+ and PlusCal Verification (The Blueprint Verifier) |
| system | any | generative-art-deployment | SOP: Generative Art Deployment (The Gallery Protocol) |
| system | foundation | legal-compliance-matrix | legal-compliance-matrix |
| system | any | market-gap-analysis | SOP: Full-Breath Market-Gap Analysis & Defensive Parrying |
| system | any | mcp-server-fleet-management | SOP: MCP Server Fleet Management (The Server Protocol) |
| system | any | multi-agent-swarm-orchestration | SOP: Multi-Agent Swarm Orchestration (The Polymorphic Swarm) |
| system | any | network-testament-protocol | SOP: Network Testament Protocol (The Mirror Protocol) |
| system | foundation | ontological-renaming | ontological-renaming |
| system | any | open-source-licensing-and-ip | SOP: Open Source Licensing and IP (The Commons Protocol) |
| system | any | performance-interface-design | SOP: Performance Interface Design (The Stage Protocol) |
| system | any | pitch-deck-rollout | SOP: Pitch Deck Generation & Rollout |
| system | any | polymorphic-agent-testing | SOP: Polymorphic Agent Testing (The Adversarial Protocol) |
| system | any | promotion-and-state-transitions | SOP: Promotion & State Transitions |
| system | foundation | readme-and-documentation | readme-and-documentation |
| system | any | recursive-study-feedback | SOP: Recursive Study & Feedback Loop (The Ouroboros) |
| system | any | repo-onboarding-and-habitat-creation | SOP: Repo Onboarding & Habitat Creation |
| system | any | research-to-implementation-pipeline | SOP: Research-to-Implementation Pipeline (The Gold Path) |
| system | any | security-and-accessibility-audit | SOP: Security & Accessibility Audit |
| system | any | session-self-critique | session-self-critique |
| system | any | smart-contract-audit-and-legal-wrap | SOP: Smart Contract Audit and Legal Wrap (The Ledger Protocol) |
| system | any | source-evaluation-and-bibliography | SOP: Source Evaluation & Annotated Bibliography (The Refinery) |
| system | any | stranger-test-protocol | SOP: Stranger Test Protocol |
| system | any | strategic-foresight-and-futures | SOP: Strategic Foresight & Futures (The Telescope) |
| system | any | styx-pipeline-traversal | SOP: Styx Pipeline Traversal (The 7-Organ Transmutation) |
| system | any | system-dashboard-telemetry | SOP: System Dashboard Telemetry (The Panopticon Protocol) |
| system | any | the-descent-protocol | the-descent-protocol |
| system | any | the-membrane-protocol | the-membrane-protocol |
| system | any | theoretical-concept-versioning | SOP: Theoretical Concept Versioning (The Epistemic Protocol) |
| system | any | theory-to-concrete-gate | theory-to-concrete-gate |
| system | any | typological-hermeneutic-analysis | SOP: Typological & Hermeneutic Analysis (The Archaeology) |
| unknown | any | SOP-SS-ATM-001_001-atomic-decomposition | SOP-SS-ATM-001_001: Atomic Decomposition & Coverage Proof |
| unknown | any | SOP-SS-CLT-001_001-ontology_client_decisions | SOP-SS-CLT-001_001-ontology_client_decisions |
| unknown | any | SOP-SS-CNT-001_001-content-extraction-and-node-injection | SOP-SS-CNT-001_001: Content Extraction & Node Injection |
| unknown | any | SOP-SS-ISS-001-001-ontology-issue-specification | SOP-SS-ISS-001-001-ontology-issue-specification |
| unknown | any | SOP-SS-PRC-001_001-ontology_meta_process | SOP-SS-PRC-001-001-ontology-meta-process |
| unknown | any | SOP-SS-QAB-001_001-project-board-qa | SOP-SS-QAB-001_001-project-board-qa |
| unknown | any | SOP-SS-TRK-001_001-ontology_issue_tracking | SOP-SS-TRK-001_001-ontology_issue_tracking |
| unknown | any | registry | SOP Registry — Sovereign Systems |

Linked skills: api-design-patterns, cicd-resilience-and-recovery, coding-standards-enforcer, continuous-learning-agent, contract-risk-analyzer, cross-agent-handoff, evaluation-to-growth, gdpr-compliance-check, genesis-dna, multi-agent-workforce-planner, planning-and-roadmapping, promotion-and-state-transitions, quality-gate-baseline-calibration, repo-onboarding-and-habitat-creation, security-threat-modeler, structural-integrity-audit


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


## Live System Variables (Ontologia)

| Variable | Value | Scope | Updated |
|----------|-------|-------|---------|
| `active_repos` | 89 | global | 2026-04-14 |
| `archived_repos` | 54 | global | 2026-04-14 |
| `ci_workflows` | 107 | global | 2026-04-14 |
| `code_files` | 0 | global | 2026-04-14 |
| `dependency_edges` | 60 | global | 2026-04-14 |
| `operational_organs` | 10 | global | 2026-04-14 |
| `published_essays` | 29 | global | 2026-04-14 |
| `repos_with_tests` | 0 | global | 2026-04-14 |
| `sprints_completed` | 33 | global | 2026-04-14 |
| `test_files` | 0 | global | 2026-04-14 |
| `total_organs` | 10 | global | 2026-04-14 |
| `total_repos` | 145 | global | 2026-04-14 |
| `total_words_formatted` | 0 | global | 2026-04-14 |
| `total_words_numeric` | 0 | global | 2026-04-14 |
| `total_words_short` | 0K+ | global | 2026-04-14 |

Metrics: 9 registered | Observations: 32128 recorded
Resolve: `organvm ontologia status` | Refresh: `organvm refresh`


## System Density (auto-generated)

AMMOI: 58% | Edges: 42 | Tensions: 33 | Clusters: 5 | Adv: 23 | Events(24h): 32336
Structure: 8 organs / 145 repos / 1654 components (depth 17) | Inference: 98% | Organs: META-ORGANVM:65%, ORGAN-I:53%, ORGAN-II:48%, ORGAN-III:54% +5 more
Last pulse: 2026-04-14T21:31:36 | Δ24h: -1.0% | Δ7d: n/a


## Dialect Identity (Trivium)

**Dialect:** EXECUTABLE_ALGORITHM | **Classical Parallel:** Arithmetic | **Translation Role:** The Engineering — proves that proofs compute

Strongest translations: I (formal), II (structural), VII (structural)

Scan: `organvm trivium scan III <OTHER>` | Matrix: `organvm trivium matrix` | Synthesize: `organvm trivium synthesize`


## Logos Documentation Layer

**Status:** MISSING | **Symmetry:** 0.0 (VACUUM)

Nature demands a documentation counterpart. This formation maintains its narrative record in `docs/logos/`.

### The Tetradic Counterpart
- **[Telos (Idealized Form)](../docs/logos/telos.md)** — The dream and theoretical grounding.
- **[Pragma (Concrete State)](../docs/logos/pragma.md)** — The honest account of what exists.
- **[Praxis (Remediation Plan)](../docs/logos/praxis.md)** — The attack vectors for evolution.
- **[Receptio (Reception)](../docs/logos/receptio.md)** — The account of the constructed polis.

### Alchemical I/O
- **[Source & Transmutation](../docs/logos/alchemical-io.md)** — Narrative of inputs, process, and returns.



*Compliance: Formation is currently void.*

<!-- ORGANVM:AUTO:END -->
