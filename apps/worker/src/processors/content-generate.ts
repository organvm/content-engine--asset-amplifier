import { JobPayloads } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { generateAssetContent, deduplicateContentUnits } from '@cronus/content-generation';
import { scoreContentUnits } from '@cronus/scoring';
import { getDb, schema, eq } from '@cronus/db';
import { Platform } from '@cronus/domain';

const logger = createLogger('processor:content-generate');

export async function processContentGenerate(data: JobPayloads['content.generate']): Promise<void> {
  const { brandId, assetId, platforms } = data;
  logger.info({ brandId, assetId, platforms }, 'Generating content for asset...');

  // 1. Generate Content Units
  await generateAssetContent({
    brandId,
    assetId,
    platforms: platforms as Platform[],
  });

  // 2. Fetch created content unit IDs for scoring & deduplication
  const db = getDb();
  const fragments = await db.select({ id: schema.fragments.id }).from(schema.fragments).where(eq(schema.fragments.asset_id, assetId));
  const fragmentIds = fragments.map(f => f.id);

  if (fragmentIds.length > 0) {
    const units = await db.select({ id: schema.contentUnits.id }).from(schema.contentUnits).where(eq(schema.contentUnits.brand_id, brandId));
    const unitIds = units.map(u => u.id);

    if (unitIds.length > 0) {
      logger.info({ unitCount: unitIds.length }, 'Scoring and deduplicating generated content units...');
      await scoreContentUnits(unitIds);
      await deduplicateContentUnits(brandId, unitIds);
    }
  }

  logger.info({ assetId }, 'Content generation, scoring, and deduplication complete.');
}
