# ADR-001: Consolidate on BullMQ, retire Temporal

**DEPRECATED by ADR-002 — see below**  
**Original Status:** Accepted → **Superseded**  
**Date:** 2026-07-19  
**Deciders:** Anthony Padavano  
**Closes:** #11, #11-reopened  

## Context

The repo contains two parallel async orchestration layers that were never integrated:

| Layer | Location | Installed | Wired | Consuming jobs |
|-------|----------|-----------|-------|----------------|
| BullMQ | `packages/queue/` | ✅ `bullmq ^5.80.1` | 1 enqueue site (`asset-ingestion`) | 0 workers |
| Temporal | `infra/temporal/` | ❌ `@temporalio/*` missing | 5 workflows, 5 activities | No worker entrypoint |

Additionally, the API routes bypass both systems entirely — `routes/content.ts`, `routes/resize.ts`, and `routes/natural-center.ts` call service functions directly with fire-and-forget `.catch(log)`.

### Current state

**BullMQ** (`packages/queue/`):
- Well-typed `JobPayloads` interface with 8 job names.
- `createQueue()` and `createWorker()` factories exist.
- Redis connection via `REDIS_URL` env var.
- 1 enqueue site: `services/asset-ingestion/src/index.ts` enqueues `asset.process`.
- 0 workers exist anywhere — jobs are enqueued but never consumed.
- `routes/jobs.ts` creates raw `new Queue()` instances to check job status.

**Temporal** (`infra/temporal/`):
- 5 workflows: `assetProcessing`, `contentGeneration`, `ncDerivation`, `publishing`, `analyticsCollection`.
- 5 activity files that import service packages directly.
- No `@temporalio/*` in any `package.json` or lockfile — code is uncompilable.
- No worker entrypoint (no `worker.ts` or `runWorker()`).
- No Temporal server connection config.

**API routes** (Fastify):
- `routes/content.ts:39-43` — calls `generateAssetContent()` directly.
- `routes/resize.ts:41-46` — calls `resizeDesignBatch()` directly.
- `routes/natural-center.ts:40-44` — calls `deriveNaturalCenter()` directly.
- None of these enqueue to BullMQ or start Temporal workflows.

### Why both exist

The repo was built in phases: BullMQ was added first for simple job queuing, then Temporal was prototyped for durable workflow orchestration (retry, compensation, timeouts). Neither was completed — BullMQ has no consumers, Temporal has no runtime.

## Decision

**Consolidate on BullMQ. Retire Temporal.**

### Rationale

1. **BullMQ is installed, typed, and partially wired.** The `packages/queue/` package has a clean typed interface. Adding workers is straightforward. Temporal requires installing `@temporalio/worker`, `@temporalio/workflow`, `@temporalio/activity`, and `@temporalio/client`, plus running a Temporal server (or connecting to Temporal Cloud). That's a significant infrastructure dependency for an MVP.

2. **The workflow complexity doesn't justify Temporal yet.** The current pipelines are linear: extract → score → generate → publish. Temporal's value (saga compensation, long-lived timers, child workflows, cron schedules) becomes critical at scale, not at MVP. BullMQ with retry/backoff handles the current load.

3. **Temporal adds operational overhead.** A Temporal server (or cloud account) is a separate runtime to provision, monitor, and pay for. BullMQ uses the existing Redis instance. For a two-person startup pre-launch, minimizing infrastructure is correct.

4. **The API already bypasses both.** The real problem isn't which orchestrator to pick — it's that nothing is actually orchestrated. The fix is to wire the API routes to enqueue BullMQ jobs instead of calling services directly.

### What to keep from Temporal

The workflow definitions in `infra/temporal/workflows/` encode valuable domain knowledge about pipeline ordering, retry semantics, and failure modes. We should:

1. **Port the pipeline sequence logic** into BullMQ job chains (parent → child jobs using BullMQ's `flows` API).
2. **Port the retry/backoff semantics** into BullMQ worker options.
3. **Archive the Temporal workflow files** as documentation but remove them from the build graph.

### What to implement

| Phase | Work | Issue |
|-------|------|-------|
| 1 | Wire API routes to enqueue BullMQ jobs instead of direct calls | #11 |
| 2 | Add BullMQ workers for each pipeline stage | #11 |
| 3 | Add BullMQ monitoring dashboard (Bull Board) | future |
| 4 | Revisit Temporal if workflow complexity warrants it | future |

### BullMQ job chain design

```
asset.process
  → nc.derive (if brand has no NC yet)
  → content.generate
    → content.score
      → publish.execute (per approved variant)

analytics.collect (scheduled, independent)

design.resize (on-demand, independent)
```

Each stage enqueues the next stage's job on success. Failure at any stage retries per BullMQ config (exponential backoff, 3 attempts default). Failed jobs move to the Redis failed set for inspection.

## Consequences

- **Positive:** Single orchestration model. Installable from fresh clone. API routes get proper async handling (no fire-and-forget).
- **Positive:** `packages/queue/` becomes the canonical job contract. All pipeline stages share the same `JobPayloads` type map.
- **Negative:** Temporal's durable execution guarantees (exactly-once, automatic recovery) are lost. Acceptable at MVP scale.
- **Negative:** The `infra/temporal/` directory becomes dead code. We archive it rather than delete it to preserve the workflow design docs.
- **Neutral:** Redis remains a required dependency (already required for BullMQ and caching).

## Alternatives considered

1. **Keep both, define boundaries** — BullMQ for simple jobs, Temporal for complex workflows. Rejected: adds cognitive overhead and two runtimes for no current benefit.
2. **Switch entirely to Temporal** — Rejected: installs `@temporalio/*`, requires Temporal server, overkill for linear pipelines.
3. **Replace both with a simple in-process queue** — Rejected: loses persistence, retry, and multi-process capability needed for Cloudflare Workers + local dev split.

## References

- [BullMQ documentation](https://docs.bullmq.io/)
- [Temporal TypeScript SDK](https://docs.temporal.io/typescript/)
- Issue #11: [BullMQ vs Temporal integration decision](https://github.com/organvm/content-engine--asset-amplifier/issues/11)
