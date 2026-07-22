# ADR-002: Dual Runtime — BullMQ for light jobs, Temporal for durable workflows

**Status:** Accepted  
**Date:** 2026-07-22  
**Deciders:** Operator  
**Supersedes:** ADR-001  

## Context

ADR-001 (2026-07-19) chose to consolidate on BullMQ and retire Temporal. Since then:

1. **Temporal activities and workflows are fully implemented** — 5 workflows, 5 activity files that call real service packages (`@cronus/db`, `@cronus/config`, `@cronus/scoring`, etc.). These are not stubs — they do real work.

2. **A Temporal worker entrypoint exists** (`apps/temporal-worker/`) that registers all workflows and activities with a proper Worker, client, and task queue.

3. **The BullMQ workers are also operational** — `apps/worker/src/processors/` has running workers for `asset.process`, `content.generate`, `nc.derive`, `publish.execute`, and `analytics.collect`.

## Decision

**Keep both active with clear boundaries.** BullMQ handles lightweight, stateless job processing. Temporal handles durable, multi-step workflow orchestration requiring retry, compensation, or long timeouts.

### Boundary

| Concern | Runtime | Reason |
|---------|---------|--------|
| Asset ingestion (upload → extract → score) | Temporal | Multi-step with retry: extract fragments → score → mark complete |
| Content generation (prompt → store → score) | Temporal | Long-running LLM calls with fallback providers |
| NC derivation (keyframe + transcript → profile) | Temporal | Multi-step analysis requiring vision + text LLM |
| Publishing (adapter → platform → record) | Temporal | External API calls with retry and compensation (mark failed) |
| Analytics collection (observation → report) | BullMQ | Fire-and-forget, stateless, no compensation needed |
| Design resize (upload → variant → store) | BullMQ | Deterministic, fast, no retry logic needed |
| Webhook dispatch (event → fan-out → retry) | BullMQ | Simple fan-out, no multi-step orchestration |

### Implementation status

| Component | Status |
|-----------|--------|
| Temporal workflows (5) | `infra/temporal/workflows/` — operational |
| Temporal activities (5) | `infra/temporal/activities/` — operational |
| Temporal worker | `apps/temporal-worker/` — scaffolded, runs via `tsx` |
| Temporal client | `apps/temporal-worker/src/client.ts` — ready for API integration |
| BullMQ queues | `packages/queue/` — typed `JobPayloads` with 8 job names |
| BullMQ workers (5) | `apps/worker/src/processors/` — operational |

## Consequences

- **Positive:** Each runtime handles what it's best at. Temporal's durable execution (exactly-once, automatic recovery) for complex flows; BullMQ's lightweight Redis-backed queuing for simple jobs.
- **Positive:** No migration needed — both are already implemented.
- **Negative:** Two runtimes to deploy and monitor. Temporal requires a server (local `docker compose` or Temporal Cloud). BullMQ requires Redis (already present).
- **Neutral:** `infra/temporal/` continues to contain the workflow definitions. `apps/temporal-worker/` is the runtime. `apps/worker/` continues as the BullMQ worker process.

## References

- [ADR-001](./001-bullmq-consolidation.md) — original consolidation decision (superseded)
- [BullMQ documentation](https://docs.bullmq.io/)
- [Temporal TypeScript SDK](https://docs.temporal.io/typescript/)
