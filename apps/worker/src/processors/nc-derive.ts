import { JobPayloads } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { deriveNaturalCenter } from '@cronus/natural-center';

const logger = createLogger('processor:nc-derive');

export async function processNcDerive(data: JobPayloads['nc.derive']): Promise<void> {
  const { brandId, assetIds, toneDescription } = data;
  logger.info({ brandId, assetIds }, 'Deriving Natural Center identity...');

  await deriveNaturalCenter({
    brandId,
    assetIds,
    toneDescription,
  });

  logger.info({ brandId }, 'Natural Center derived successfully.');
}
