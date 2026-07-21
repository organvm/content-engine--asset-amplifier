import { createWorker } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { startSchedulerLoop } from '@cronus/scheduler';
import { processAsset } from './processors/asset.js';
import { executePublish } from './processors/publish.js';
import { processContentGenerate } from './processors/content-generate.js';
import { processNcDerive } from './processors/nc-derive.js';
import { processAnalyticsCollect } from './processors/analytics.js';

const logger = createLogger('worker-main');

async function main() {
  logger.info('Starting Cronus Background Workers & Scheduler...');

  const schedulerLoop = startSchedulerLoop(60000); // Poll every 60 seconds

  const assetWorker = createWorker('asset.process', async (job) => {
    logger.info({ data: job.data }, `Starting asset processing for job ${job.id}`);
    await processAsset(job.data);
  });

  const contentGenWorker = createWorker('content.generate', async (job) => {
    logger.info({ data: job.data }, `Starting content generation for job ${job.id}`);
    await processContentGenerate(job.data);
  });

  const publishWorker = createWorker('publish.execute', async (job) => {
    logger.info({ data: job.data }, `Starting publish execution for job ${job.id}`);
    await executePublish(job.data);
  });

  const ncDeriveWorker = createWorker('nc.derive', async (job) => {
    logger.info({ data: job.data }, `Starting NC derivation for job ${job.id}`);
    await processNcDerive(job.data);
  });

  const analyticsWorker = createWorker('analytics.collect', async (job) => {
    logger.info({ data: job.data }, `Starting analytics collection for job ${job.id}`);
    await processAnalyticsCollect(job.data);
  });

  const workers = [assetWorker, contentGenWorker, publishWorker, ncDeriveWorker, analyticsWorker];

  workers.forEach((worker) => {
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} (${worker.name}) completed successfully`);
    });

    worker.on('failed', (job, err) => {
      logger.error({ err }, `Job ${job?.id} (${worker.name}) failed`);
    });
  });

  const gracefulShutdown = async () => {
    logger.info('Shutting down workers and scheduler loop...');
    schedulerLoop.stop();
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

main().catch((err) => {
  logger.error('Workers failed to start', err);
  process.exit(1);
});
