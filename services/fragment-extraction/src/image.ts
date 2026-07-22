import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { createStorage } from '@cronus/storage';
import { getDb, schema } from '@cronus/db';
import { FragmentType } from '@cronus/domain';
import { createLogger } from '@cronus/logger';

const log = createLogger('fragment-extraction:image');

/**
 * Extracts fragments from an image asset.
 * 
 * - Generates multiple aspect-ratio variants (square, portrait, story).
 * - Uses Sharp's entropy-based strategy for smart cropping.
 * - Detects focal point via Sharp's entropy-weighted crop analysis.
 */
export async function extractImageFragments(params: {
  assetId: string;
  brandId: string;
  storageKey: string;
}) {
  const { assetId, brandId, storageKey } = params;
  const db = getDb();
  const storage = createStorage();

  log.info({ assetId }, 'Starting image fragment extraction');

  try {
    // 1. Download source image
    const buffer = await storage.download(storageKey);
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read image metadata');
    }

    // 2. Define target formats for social platforms
    const targets = [
      { name: 'square', width: 1080, height: 1080, label: 'Instagram Feed (1:1)' },
      { name: 'portrait', width: 1080, height: 1350, label: 'Instagram/LinkedIn (4:5)' },
      { name: 'story', width: 1080, height: 1920, label: 'Stories/TikTok/Reels (9:16)' },
      { name: 'landscape', width: 1200, height: 628, label: 'Facebook/X (1.91:1)' },
    ];

    for (const target of targets) {
      const fragmentId = randomUUID();
      const extension = metadata.format === 'png' ? 'png' : 'jpg';
      const fragmentStorageKey = `brands/${brandId}/fragments/${assetId}/${target.name}-${fragmentId}.${extension}`;

      log.debug({ target: target.name, assetId }, 'Generating crop');

      // 3. Perform smart crop using entropy strategy (picks the most "interesting" region)
      const croppedBuffer = await image
        .resize(target.width, target.height, {
          fit: 'cover',
          position: sharp.strategy.entropy
        })
        .toFormat(extension === 'png' ? 'png' : 'jpeg', { quality: 90 })
        .toBuffer();

      // 4. Upload to storage
      await storage.upload(
        fragmentStorageKey, 
        croppedBuffer, 
        extension === 'png' ? 'image/png' : 'image/jpeg'
      );

      // 5. Create Fragment record
      await db.insert(schema.fragments).values({
        id: fragmentId,
        asset_id: assetId,
        type: FragmentType.crop,
        storage_key: fragmentStorageKey,
        quality_score: 1.0,
        extraction_metadata: { 
          target: target.name,
          label: target.label,
          width: target.width,
          height: target.height,
          strategy: 'entropy',
          original_format: metadata.format
        },
      });
    }

    log.info({ assetId, fragment_count: targets.length }, 'Successfully extracted fragments from image');
  } catch (error) {
    log.error({ err: error, assetId }, 'Image fragment extraction failed');
    throw error;
  }
}
