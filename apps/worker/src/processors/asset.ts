import { JobPayloads, createQueue } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { processAssetFragments } from '@cronus/fragment-extraction';
import { Platform } from '@cronus/domain';

const logger = createLogger('processor:asset');

export async function processAsset(data: JobPayloads['asset.process']): Promise<void> {
  const { assetId, brandId } = data;
  logger.info({ assetId, brandId }, 'Processing asset fragments...');

  await processAssetFragments(assetId);

  logger.info({ assetId }, 'Asset fragments extracted. Enqueuing content generation...');

  const contentQueue = createQueue('content.generate');
  await contentQueue.add('content.generate', {
    brandId,
    assetId,
    platforms: [
      Platform.instagram_feed,
      Platform.instagram_reels,
      Platform.linkedin,
      Platform.x,
      Platform.tiktok,
    ],
    postsPerFragment: 1,
  });

  logger.info({ assetId }, 'Content generation enqueued successfully.');
}
