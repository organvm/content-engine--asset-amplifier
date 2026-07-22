# Praxis — Remediation & Attack Plan
*The active strategy for evolving Cronus Metabolus from local MVP to global production*

> "Praxis is the bridge where theoretical proof becomes computing reality."

## Strategic Attack Vectors

### Vector 1: Background Queue Workers & Event Pipeline (`apps/worker`)
- **Objective**: Ensure background queues perform real asset processing, content generation, and publish dispatch rather than stubbed timers.
- **Status**: **Completed**. Wired `asset.process` → `@cronus/fragment-extraction`, `content.generate` → `@cronus/content-generation`, `publish.execute` → `@cronus/platform-adapter`, `nc.derive` → `@cronus/natural-center`.
- **Next Step**: Add an automated cron poller for `publish_events` due for dispatch.

### Vector 2: Multi-Platform Publishing & OAuth
- **Objective**: Complete production-ready publishing adapters and OAuth initiation flows for all target social platforms.
- **Status**: LinkedIn OAuth live and encrypted in DB. Platform adapters for Instagram, X, TikTok, and YouTube Shorts implemented as uniform structural adapters.
- **Next Step**: App review and OAuth client registration for Meta Graph API (Instagram) and TikTok Content Posting API.

### Vector 3: Dashboard Telemetry & Autopoietic Identity Feedback
- **Objective**: Expose computable brand performance (Asset ROI) and identity confidence (Identity Mirror) in the dashboard.
- **Status**: **Completed**.
  - `/api/v1/brands/:id/roi` endpoint wired to Hono/Cloudflare Worker API.
  - Recharts bar visualization implemented in `AssetRoi.tsx`.
  - Autopoietic Inquiry answer API route + interactive UI created in `Identity.tsx`.

### Vector 4: Surface Composer & Instrument Manifests
- **Objective**: Transform project composition from ad-hoc posts into structured visual instruments with JSON manifest export.
- **Status**: **Completed**.
  - Surface Composer grid simulator built with Triptych reverse-upload warnings.
  - `GET /api/v1/brands/:id/projects/:projectId/manifest` endpoint live on API backend.
  - `apps/narcissus-v0` Vite/React local sandbox created for testing recursive canvas loop.

### Vector 5: Infrastructure & CI/CD Hardening
- **Objective**: Fully automated build, lint, typecheck, test, and deployment pipelines.
- **Status**: **Completed**.
  - `.github/workflows/ci.yml` validates full monorepo quality.
  - `.github/workflows/deploy-api.yml` deploys Hono API to Cloudflare Workers with secret validation.
  - `.github/workflows/deploy-dashboard.yml` deploys React dashboard to Cloudflare Pages.

## Verification Matrix

| Target | Command / Test | Benchmark |
|--------|----------------|-----------|
| Monorepo Build | `pnpm run build` | 21/21 packages build cleanly |
| Code Quality | `pnpm lint && pnpm typecheck` | 0 errors |
| Worker Service | `pnpm --filter @cronus/worker build` | Clean ESM bundle |
| Dashboard UI | `pnpm --filter @cronus/dashboard build` | Clean Vite production bundle |

## Operational Directives
1. **Zero Credential Intrusion**: No secrets or API keys committed to repository code; all credentials injected via Wrangler secrets or environment bindings.
2. **Dual-Runtime Equivalence**: Ensure routes added to Fastify `apps/api/src/routes` are mirrored in Hono `apps/api/src/worker.ts`.
3. **Single Source of Truth**: All domain interfaces live strictly inside `packages/domain`.
