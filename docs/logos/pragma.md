# Pragma — Concrete State
*The honest account of what exists as of 2026-07-21*

## What Has Been Built

### Infrastructure
- **Monorepo**: pnpm + Turbo, 21 workspace packages, ESM throughout, Node ≥22
- **Database**: Neon PostgreSQL 17 + pgvector. 14 Drizzle schema tables across migrations
- **Storage**: Cloudflare R2 bucket (`cronus-assets`) + local FilesystemStorageClient fallback
- **Queue**: BullMQ typed contracts (`packages/queue`) — 8 job types defined and 5 processors active
- **CI/CD**: GitHub Actions — ci.yml (typecheck/lint/test/build), deploy-api.yml (CF Worker), deploy-dashboard.yml (CF Pages)

### API — Dual Runtime
`apps/api` operates in two modes:
- **Cloudflare Worker** (`src/worker.ts`, Hono): Production surface. Handles brands, assets (R2 upload + auto-generation), content approve/reject, Natural Center, inquiries, ROI, settings/providers, billing (Stripe checkout + webhook).
- **Fastify Dev Server** (`src/server.ts`): Full-pipeline dev surface with integration tests (`server.test.ts`) covering health, settings, billing, and OAuth initiation.

### Services (TypeScript sources, bundled into API)
| Service | Status |
|---------|--------|
| `asset-ingestion` | Real — orchestrates upload + DB insert + validation test suite |
| `fragment-extraction` | Real — video (FFmpeg probing/clips/keyframes/audio), image (Sharp crops), transcription (Whisper) |
| `content-generation` | Real — LLM prompt generation (multi-platform), FFmpeg aspect-ratio scale/pad formatting, cross-platform deduplication |
| `natural-center` | Real — LLM synthesis → NC profile, embedding, inquiry generation, compileSystemPrompt, confidence estimation |
| `scoring` | Real — pgvector cosine distance search (`querySimilarNaturalCenters`) + in-memory cosine similarity |
| `platform-adapter` | Real registry — LinkedIn, Instagram, TikTok OAuth initiation/callback, real fetch API publish (v2/ugcPosts, TikTok init, Graph API) |
| `scheduler` | Real — `dispatchDuePublishEvents()` and `startSchedulerLoop()` interval worker |
| `analytics` | Real — `collectMetrics()`, `normalizeMetrics()`, `computeWeeklyReportSummary()` report generation |
| `design-resizer` | Real — Sharp-based multi-format resizing, aspect ratio enforcement |
| `audience-engine` | Real — `recordConversionEvent()`, `getProjectFunnelMetrics()`, `computeFunnelStepMetrics()` |

### Applications
| App | Status |
|-----|--------|
| `apps/api` | Deployed to Cloudflare Workers / Fastify dev server |
| `apps/dashboard` | React 19 + Vite 8 + Tailwind. 17 pages (including `/publish`). Deployed to CF Pages. |
| `apps/cli` | `cronus ingest` (kerygma parser), `cronus manifest` (instrument manifest generator), `cronus upload`, `cronus status` |
| `apps/worker` | BullMQ worker node. 5 processors active (`asset.process`, `content.generate`, `publish.execute`, `nc.derive`, `analytics.collect`) |
| `apps/narcissus-v0` | NARCISSUS recursive canvas Vite/React sandbox |

### Monorepo Testing & Quality
- **Build Status**: **21/21 packages passing**.
- **Test Suite**: **35/35 test tasks passing** via `pnpm test`.
- **E2E Runnable Pipeline**: `pnpm run demo` (`infra/scripts/e2e-demo.ts`) executes vector scoring, deduplication, conversion funnel analysis, and weekly reporting math in a single pass.
