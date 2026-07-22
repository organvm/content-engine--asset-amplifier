import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';

export { Queue, Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Job payload type map — single source of truth for all queue contracts
// ---------------------------------------------------------------------------

export interface JobPayloads {
  'asset.process': { assetId: string; brandId: string };
  'nc.derive': { brandId: string; assetIds: string[]; toneDescription?: string };
  'nc.refine': { brandId: string; adjustments: Record<string, string> };
  'content.generate': {
    brandId: string;
    assetId: string;
    platforms: string[];
    postsPerFragment: number;
  };
  'content.score': { contentUnitIds: string[] };
  'publish.execute': { publishEventId: string };
  'analytics.collect': { brandId: string };
  'design.resize': {
    brandId: string;
    storageKey: string;
    targetFormats: string[];
  };
  'render.video': {
    brandId: string;
    assetId: string;
    fragmentId: string;
    headline?: string;
    watermark?: string;
  };
}

export type JobName = keyof JobPayloads;

// ---------------------------------------------------------------------------
// Redis connection helper
// ---------------------------------------------------------------------------

export function getRedisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('Missing required env var: REDIS_URL');
  }

  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined, // allow-secret
    username: parsed.username || undefined,
  };
}

// ---------------------------------------------------------------------------
// Typed queue factory
// ---------------------------------------------------------------------------

export function createQueue<N extends JobName>(name: N): Queue<JobPayloads[N]> {
  return new Queue<JobPayloads[N]>(name, {
    connection: getRedisConnection(),
  });
}

// ---------------------------------------------------------------------------
// Typed worker factory
// ---------------------------------------------------------------------------

export function createWorker<N extends JobName>(
  name: N,
  processor: (job: Job<JobPayloads[N]>) => Promise<void>,
): Worker<JobPayloads[N]> {
  return new Worker<JobPayloads[N]>(name, processor, {
    connection: getRedisConnection(),
  });
}
