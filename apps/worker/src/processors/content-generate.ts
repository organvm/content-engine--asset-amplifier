import { JobPayloads } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { generateAssetContent } from '@cronus/content-generation';
import { Platform } from '@cronus/domain';

const logger = createLogger('processor:content-generate');

export async function processContentGenerate(data: JobPayloads['content.generate']): Promise<void> {
  const { brandId, assetId, platforms } = data;
  logger.info({ brandId, assetId, platforms }, 'Generating content for asset...');

  await generateAssetContent({
    brandId,
    assetId,
    platforms: platforms as Platform[],
  });

  logger.info({ assetId }, 'Content generation completed.');
}
