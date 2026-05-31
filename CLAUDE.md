# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Cronus Metabolus** (formerly Content Engine — Asset Amplifier) is an AI-powered content yield engine. It ingests one premium asset (hero film, 3D render, product shoot), fragments it (clips, stills, captions), and synthesizes 30+ days of platform-optimized social posts. Partnership: Padavano (engineering) + Lefler Design (UI/UX, marketing, sales). Organ III (Ergon — Commerce). MVP operational, production deployed.

## Live Deployments

| Component | URL / Identifier |
|-----------|------------------|
| API (Cloudflare Worker) | https://cronus-api.ivixivi.workers.dev |
| Dashboard (Cloudflare Pages) | https://cronus-dashboard.pages.dev |
| Pitch Decks | https://cronus-metabolus.pages.dev |
| Database | Neon `green-art-84790526` (PostgreSQL 16 + pgvector) |
| R2 bucket | `cronus-assets` |
| Issues | [organvm-iii-ergon/content-engine--asset-amplifier/issues](https://github.com/organvm-iii-ergon/content-engine--asset-amplifier/issues) |
| Project Board | [Operating Board](https://github.com/orgs/organvm-iii-ergon/projects/6) |

## Roadmap (GitHub Issues)

| Phase | Issues |
|-------|--------|
| α (Dashboard) | #6 Asset ROI, #7 Identity Mirror, #8 Brand selector, #9 Content detail |
| β (Platform) | #1 X adapter, #2 TikTok, #3 YouTube, #4 Instagram OAuth, #5 Real publishing |
| γ (Scale) | #13 Agency dashboard, #14 Design resizing |
| infra | #10 CI/CD, #11 BullMQ/Temporal, #12 pgvector migration |

## Repo Layout (pnpm + Turbo monorepo)

Workspace globs in `pnpm-workspace.yaml`: `apps/*`, `services/*`, `packages/*`. Node ≥22, pnpm ≥9, ESM throughout (`"type": "module"`).

- **`apps/api`** — REST API. **Two runtimes** (see Architecture).
- **`apps/dashboard`** — React 19 + Vite 8 + Tailwind 3. Deployed to Cloudflare Pages.
- **`apps/cli`** — Management CLI (`tsx`-run TS).
- **`packages/`** — `config` (shared TS/ESLint + AI provider resolver), `db` (Drizzle + Neon), `domain` (shared types/Zod), `logger` (Pino), `queue` (BullMQ), `storage` (R2/S3 abstraction).
- **`services/`** — `asset-ingestion`, `fragment-extraction`, `natural-center`, `content-generation`, `scoring`, `scheduler`, `platform-adapter`, `analytics`, `design-resizer`, `audience-engine`. Imported into the API as workspace deps; many are stubs/sources-only and bundled via `wrangler.toml [alias]`.
- **`infra/docker`** — local Postgres + Redis compose.
- **`infra/temporal`** — workflow defs (queued for #11).

## Architecture: Dual-Runtime API

`apps/api` is **deployed as a Cloudflare Worker** (`src/worker.ts`, Hono) but **also runs locally as a Fastify server** (`src/server.ts`). They are not feature-equivalent:

- `worker.ts` is the canonical production surface — Hono on Cloudflare Workers, R2 binding for asset storage, Neon HTTP driver for Postgres. **Cannot run FFmpeg / native binaries** — the Worker collapses the fragment-extraction pipeline by treating the whole upload as one synthetic fragment, then calls the LLM provider directly to mint per-platform `content_units`.
- `server.ts` is the Fastify dev/full-stack version with route plugins under `src/routes/*` and an `authPlugin`. Use this when you need the full pipeline (queues, services, FFmpeg-bound work).
- `wrangler.toml`'s `[alias]` block is **load-bearing**: it rewrites every `@cronus/*` workspace import to that package's `src/index.ts` so the Worker can bundle without depending on built `dist/` output. When adding a new package consumed by the Worker, add an alias entry.
- Worker secrets are managed via `wrangler secret put`. The Worker copies all bindings into `process.env` in a global middleware so shared packages (`@cronus/config`) work identically in both runtimes, and forces `NODE_ENV=production` to skip Ollama-localhost provider checks.

When editing API behavior, **check whether you need to update both `server.ts` routes and `worker.ts`** — they drift easily.

## DB Conventions (`packages/db`)

- Drizzle ORM, dialect `postgresql`, schema files in `src/schema/*.ts`, root export `src/schema/index.ts`.
- **Columns are `snake_case` in the DB**, and Drizzle insert/update calls use snake_case keys (`brand_id`, `processing_status`, …). API responses go through `toCamel`/`mapRows` (`src/mappers.ts`) so wire format is camelCase. Mirror this in new routes: snake_case for Drizzle, camelCase for JSON.
- Migrations: `packages/db/src/migrations/`. Drizzle Kit reads `DATABASE_URL` from env (`drizzle.config.ts`).
- Tables: `agencies`, `brands`, `natural_centers`, `assets`, `fragments`, `content_units`, `platform_connections`, `publish_events`, `performance_observations`.

## Provider Resolution (`packages/config`)

`resolveProviders()` returns the active `llm`, `embedding`, `transcription` providers plus full fallback lists. Worker uses cloud providers only (Groq, Gemini, Cerebras, Anthropic, OpenAI); Ollama is skipped when `NODE_ENV=production`.

## Key Domain Concepts

- **Metabolism** — break a Hero asset into fragments (clips/stills/text), then re-synthesize per-platform content.
- **Natural Center** — per-brand identity profile derived from approved content, used to score new fragments for brand-fit. Persisted in `natural_centers`.
- **Approval flow** — `content_units.approval_status ∈ {pending, approved, rejected}`; rejection writes `flagged_reason`.
- **Temporal Workflows** — robust retriable pipelines for FFmpeg + AI generation (queued for #11).

## Commands

```bash
# Workspace (Turbo orchestrated)
pnpm install
pnpm dev                 # turbo dev — all apps/services in parallel
pnpm build               # turbo build (depends on ^build)
pnpm test                # turbo test (Vitest)
pnpm lint                # turbo lint (ESLint per workspace)
pnpm typecheck           # turbo typecheck (tsc --noEmit)
pnpm format              # Prettier write
pnpm format:check        # Prettier check

# Single-package work — use --filter
pnpm --filter @cronus/api dev
pnpm --filter @cronus/api test
pnpm --filter @cronus/db typecheck

# Single test file / pattern (Vitest)
pnpm --filter @cronus/db test -- src/mappers.test.ts
pnpm --filter @cronus/api test -- -t "brand creation"

# Database (Drizzle)
pnpm db:migrate          # @cronus/db migrate
pnpm db:seed             # tsx infra/scripts/seed.ts

# Local infra
pnpm docker:up           # Redis + Postgres via infra/docker/docker-compose.yml
pnpm docker:down

# Cloudflare Worker (API)
cd apps/api
npx wrangler dev -c wrangler.toml                       # local Worker dev
npx wrangler deploy -c wrangler.toml                    # deploy
echo "<value>" | npx wrangler secret put <NAME> -c wrangler.toml
```

## Required Env / Secrets

Worker bindings (set via `wrangler secret put`): `DATABASE_URL`, `API_KEY`, `ENCRYPTION_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_CREATOR`, `STRIPE_PRICE_ID_STUDIO`, `DASHBOARD_URL`. R2 binding: `ASSETS_BUCKET` → `cronus-assets`.

For local Fastify dev, mirror the same names in a `.env`.

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

*Last synced: 2026-05-23T00:26:31Z*

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

Plans: 269 indexed | Chains: 5 available | SOPs: 8 active
Discover: `organvm plans search <query>` | `organvm chains list` | `organvm sop lifecycle`
Library: `/Users/4jp/Code/organvm/praxis-perpetua/library`


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | atomic-clock | The Atomic Clock |
| system | any | execution-sequence | Execution Sequence |
| system | any | multi-agent-dispatch | Multi-Agent Dispatch |
| system | any | session-handoff-avalanche | Session Handoff Avalanche |
| system | any | system-loops | System Loops |
| system | any | prompting-standards | Prompting Standards |
| system | foundation | agent-seeding-and-workforce-planning | agent-seeding-and-workforce-planning |
| system | foundation | architecture-decision-records | architecture-decision-records |
| system | any | background-task-resilience | background-task-resilience |
| system | any | context-window-conservation | context-window-conservation |
| system | foundation | legal-compliance-matrix | legal-compliance-matrix |
| system | foundation | ontological-renaming | ontological-renaming |
| system | foundation | readme-and-documentation | readme-and-documentation |
| system | any | session-self-critique | session-self-critique |
| system | any | the-descent-protocol | the-descent-protocol |
| system | any | the-membrane-protocol | the-membrane-protocol |
| system | any | theory-to-concrete-gate | theory-to-concrete-gate |
| system | any | triangulation-protocol | triangulation-protocol |

Linked skills: SOP-TRIADIC-REVIEW-PROTOCOL, api-design-patterns, cicd-resilience-and-recovery, coding-standards-enforcer, continuous-learning-agent, contract-risk-analyzer, cross-agent-handoff, evaluation-to-growth, gdpr-compliance-check, genesis-dna, multi-agent-workforce-planner, planning-and-roadmapping, promotion-and-state-transitions, quality-gate-baseline-calibration, repo-onboarding-and-habitat-creation, security-threat-modeler, session-self-critique, structural-integrity-audit, the-membrane-protocol, triple-reference


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


## Atomization Pipeline

Run `organvm atoms pipeline --write && organvm atoms fanout --write` to generate task queue.


## System Density (auto-generated)

AMMOI: 25% | Edges: 0 | Tensions: 0 | Clusters: 0 | Adv: 27 | Events(24h): 37975
Structure: 8 organs / 148 repos / 1654 components (depth 17) | Inference: 0% | Organs: META-ORGANVM:63%, ORGAN-I:53%, ORGAN-II:48%, ORGAN-III:54% +5 more
Last pulse: 2026-05-23T00:26:28 | Δ24h: n/a | Δ7d: n/a


## Dialect Identity (Trivium)

**Dialect:** EXECUTABLE_ALGORITHM | **Classical Parallel:** Arithmetic | **Translation Role:** The Engineering — proves that proofs compute

Strongest translations: I (formal), II (structural), VII (structural)

Scan: `organvm trivium scan III <OTHER>` | Matrix: `organvm trivium matrix` | Synthesize: `organvm trivium synthesize`


## Logos Documentation Layer

**Status:** ACTIVE | **Symmetry:** 0.5 (DREAM)

Nature demands a documentation counterpart. This formation maintains its narrative record in `docs/logos/`.

### The Tetradic Counterpart
- **[Telos (Idealized Form)](../docs/logos/telos.md)** — The dream and theoretical grounding.
- **[Pragma (Concrete State)](../docs/logos/pragma.md)** — The honest account of what exists.
- **[Praxis (Remediation Plan)](../docs/logos/praxis.md)** — The attack vectors for evolution.
- **[Receptio (Reception)](../docs/logos/receptio.md)** — The account of the constructed polis.

### Alchemical I/O
- **[Source & Transmutation](../docs/logos/alchemical-io.md)** — Narrative of inputs, process, and returns.



*Compliance: Record exists without implementation.*

<!-- ORGANVM:AUTO:END -->
