# Pragma — Concrete State
*The honest account of what exists as of 2026-07-21*

## What Has Been Built

### Infrastructure
- **Monorepo**: pnpm + Turbo, 21 workspace packages, ESM throughout, Node ≥22
- **Database**: Neon PostgreSQL 17 + pgvector. 14 Drizzle schema tables across 2 migrations
- **Storage**: Cloudflare R2 bucket (`cronus-assets`) with full R2Bucket binding
- **Queue**: BullMQ typed contracts (`packages/queue`) — 8 job types defined
- **CI/CD**: GitHub Actions — ci.yml (typecheck/lint/test/build), deploy-api.yml (CF Worker), deploy-dashboard.yml (CF Pages)

### API — Dual Runtime
`apps/api` operates in two modes:
- **Cloudflare Worker** (`src/worker.ts`, Hono): Production surface. Handles brands, assets (R2 upload + auto-generation), content approve/reject, Natural Center, fragments, settings/providers, billing (Stripe checkout + webhook). Cannot run FFmpeg.
- **Fastify Dev Server** (`src/server.ts`): Full-pipeline dev surface with route plugins for platforms (LinkedIn OAuth ✅), analytics, schedule, projects, publication variants, linked applications, conversion events, billing, agencies, resize, settings.

### Services (TypeScript sources, bundled into API)
| Service | Status |
|---------|--------|
| `asset-ingestion` | Real — orchestrates upload + DB insert |
| `fragment-extraction` | Real — video (FFmpeg clips/keyframes/audio), image (Sharp crops), transcription (Whisper) |
| `content-generation` | Real — LLM prompt generation (multi-platform), media formatting |
| `natural-center` | Real — LLM synthesis → NC profile, embedding, inquiry generation, onConflictDoUpdate |
| `scoring` | Scaffolded — NC alignment scoring via cosine similarity |
| `platform-adapter` | Stubbed — all adapters simulate publish/metrics. LinkedIn OAuth token storage ✅ |
| `scheduler` | Scaffolded — creates publish_events, no live dispatch loop |
| `analytics` | Scaffolded — performance observation collection |
| `design-resizer` | Real — Sharp-based multi-format resizing, aspect ratio enforcement |
| `audience-engine` | Scaffolded |

### Applications
| App | Status |
|-----|--------|
| `apps/api` | Deployed to Cloudflare Workers |
| `apps/dashboard` | React 19 + Vite 8 + Tailwind. 16 pages. Deployed to CF Pages. |
| `apps/cli` | `cronus ingest` — heuristic brainstorm parser → kerygma profiles |
| `apps/worker` | BullMQ scaffold. Processors wired to real services (as of current sprint). |
| `apps/narcissus-v0` | NARCISSUS recursive canvas Vite/React sandbox |

### Dashboard Pages (Operational)
- **Dashboard** — Stats overview (real data wired in current sprint)
- **Assets** — Upload + list assets, trigger content generation
- **Projects (Surface Composer)** — Full project composition with grid simulator, drag-and-drop, manifest export
- **Review Queue** — Approve/reject content units
- **Calendar** — Publish schedule view
- **Brand Identity** — Natural Center radar chart + inquiry loop
- **Asset ROI** — Recharts bar visualization of content output per asset
- **Design Resize** — Multi-format image/video resize tool
- **Agencies** — Multi-brand agency management
- **Settings** — Provider configuration, API key status
- **Pricing** — Stripe Checkout integration (Creator/Studio tiers)

### Platform Connections
- **LinkedIn OAuth**: Fully implemented (initiation + callback + token encryption + DB storage)
- **Instagram**: OAuth structure defined, real publish = stub
- **X/Twitter**: Stub
- **TikTok**: Stub (API documented in comments)
- **YouTube Shorts**: Stub

## What Does Not Yet Exist

### Real Publishing
No `publish.execute` processor runs live API calls to any platform. All publishing is simulated.

### Scheduler Dispatch Loop
`publish_events` are created but never automatically dispatched to the worker queue.

### Test Coverage
`repos_with_tests: 0`. `test_files: 0`. The `packages/db/src/mappers.test.ts` exists as the only test file. All services have `vitest run --passWithNoTests` as their test script.

### Temporal Workflows
`infra/temporal` exists with workflow definitions but is never wired. BullMQ is the active queue system.

### pgvector Similarity Scoring
The `brand_embedding` column is `vector(1536)` with HNSW index. No query uses it yet. NC alignment scoring uses cosine similarity placeholder only.

### Logos Documentation Layer
This file and its siblings are the first four documents in `docs/logos/`.

## Known Technical Debt
- FFmpeg re-encoding for mismatched aspect ratios is a stub in `services/content-generation/src/formatter.ts`
- Transcription accuracy (Whisper sentence-splitting lacks hook identification)
- Platform adapter `checkRateLimit()` methods all return `false` — not real rate limit checking
- `worker.ts` and `server.ts` drift easily — routes added to Fastify must be manually mirrored to Hono
- NC confidence scores are hardcoded (`{ visual: 0.8, tonal: 0.5 }`) rather than derived from real analysis
