import { JobPayloads } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { collectMetrics } from '@cronus/analytics';

const logger = createLogger('processor:analytics');

export async function processAnalyticsCollect(data: JobPayloads['analytics.collect']): Promise<void> {
  const { brandId } = data;
  logger.info({ brandId }, 'Collecting performance metrics for brand...');

  await collectMetrics(brandId);

  logger.info({ brandId }, 'Analytics metrics collection completed.');
}
