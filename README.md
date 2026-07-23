# Cronus Metabolus (The Content Yield Engine)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Part of organvm ecosystem](https://img.shields.io/badge/organvm-ecosystem-brightgreen.svg)](https://github.com/organvm)

Transform one premium visual asset into 30+ days of platform-optimized social content—multiply your production ROI with AI-driven clip generation, captions, and multi-channel distribution.

---

## Status: Foundation Established

- **Organ:** III (Ergon) — Commerce
- **Partners:** Anthony Padavano (engineering) + Scott Lefler (design/marketing/sales)
- **Origin:** Partnership formed 2026-03-23

## The Problem

Premium brands invest heavily in hero films and product renders, often using each asset once. Meanwhile, marketing teams spend 20+ hrs/week manually creating social content. The yield on original investment is too low.

## The Solution: Metabolism

1. **Ingest** a premium video or render set (The "Hero" asset).
2. **AI Analysis:** Algorithmic determination of brand-aligned "high-energy" moments (The "Natural Center").
3. **Clip/Image Fragmentation:** 10-15 short clips, stills, and carousel fragments, resized per platform.
4. **Captions & Voice:** AI-generated captions in the brand's trained voice, including hashtag strategy and CTA variants.
5. **Robust Distribution:** One-click distribution to Instagram, LinkedIn, TikTok, YouTube Shorts, X.
6. **Yield Reporting:** Weekly engagement metrics tied back to source asset ROI.

## Architecture (pnpm monorepo)

- **apps/**: React dashboard, dual-runtime API (Cloudflare Worker + Fastify), Management CLI.
- **services/**: Specialized microservices for ingestion, extraction, and generation.
- **packages/**: Shared logic for Database (Drizzle), Domain, Storage (R2), Queues (BullMQ/Temporal).
- **infra/**: Dockerized Redis/Postgres, Temporal configuration.

## Stack

- **Frontend:** React 19 + Vite 8 + Tailwind 3 + Lucide.
- **Backend:** Node.js/TypeScript — dual-runtime API: Hono on Cloudflare Worker (production) + Fastify locally (full pipeline). See `CLAUDE.md` → Architecture: Dual-Runtime API.
- **Database:** PostgreSQL (Neon) via Drizzle ORM.
- **Workflow:** Temporal.io for retriable processing pipelines.
- **Queue:** BullMQ + Redis.
- **AI/ML:** FFmpeg, PySceneDetect, Whisper/Deepgram, Claude API.
- **Deploy:** Cloudflare Pages (dashboard) + Cloudflare Worker (API).

## Quick Start

```bash
pnpm install         # Clone and install dependencies
pnpm docker:up       # Start local infra (Redis/Postgres)
pnpm db:migrate      # Run migrations
pnpm dev             # Start development environment
```

## Contact

Questions or collaboration? Reach out via [github.com/4444J99](https://github.com/4444J99) or through the [organvm ecosystem](https://github.com/organvm).

## License

MIT
