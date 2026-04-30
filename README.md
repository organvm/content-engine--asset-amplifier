# Cronus Metabolus (The Content Yield Engine)

**Premium asset metabolism for high-yield content distribution.**

Transforms one premium visual asset (hero film, 3D render, product shoot) into 30+ days of platform-optimized social content. Built for brands that invest heavily in original production but struggle to maintain high-frequency social presence.

---

## Status: Foundation Established

- **Organ:** III (Ergon) — Commerce
- **Partners:** Anthony Padavano (engineering) + Scott Lefler (design/marketing/sales)
- **Origin:** Partnership formed 2026-03-23

## The Problem

Premium brands pay $15-50K for hero films and product renders. These assets get used once. Meanwhile, marketing teams spend 20+ hrs/week manually creating social content. The yield on original investment is too low.

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
# Clone and install
pnpm install

# Start local infra (Redis/Postgres)
pnpm docker:up

# Run migrations
pnpm db:migrate

# Start development environment
pnpm dev
```

## License

MIT
