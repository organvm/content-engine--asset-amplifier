import { createWorker } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { processAsset } from './processors/asset.js';
import { executePublish } from './processors/publish.js';

const logger = createLogger('worker-main');

async function main() {
  logger.info('Starting Cronus Background Workers...');

  const assetWorker = createWorker('asset.process', async (job) => {
    logger.info({ data: job.data }, `Starting asset processing for job ${job.id}`);
    await processAsset(job.data);
  });

  const publishWorker = createWorker('publish.execute', async (job) => {
    logger.info({ data: job.data }, `Starting publish execution for job ${job.id}`);
    await executePublish(job.data);
  });

  [assetWorker, publishWorker].forEach((worker) => {
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} (${worker.name}) completed successfully`);
    });

    worker.on('failed', (job, err) => {
      logger.error({ err }, `Job ${job?.id} (${worker.name}) failed`);
    });
  });

  const gracefulShutdown = async () => {
    logger.info('Shutting down workers...');
    await Promise.all([assetWorker.close(), publishWorker.close()]);
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

main().catch((err) => {
  logger.error('Workers failed to start', err);
  process.exit(1);
});
