import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStorage } from '@cronus/storage';
import { getDb, schema } from '@cronus/db';
import { createQueue } from '@cronus/queue';
import { MediaType, ProcessingStatus } from '@cronus/domain';
import { createLogger } from '@cronus/logger';

const log = createLogger('asset-ingestion');

/**
 * Pure validation helper for asset uploads.
 */
export function validateAssetUpload(originalFilename: string, bufferLength: number): { mediaType: MediaType; extension: string } {
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  if (bufferLength > MAX_SIZE) {
    throw new Error('File size exceeds 2GB limit');
  }

  const extension = path.extname(originalFilename).toLowerCase();
  let mediaType: MediaType;

  if (['.mp4', '.mov'].includes(extension)) {
    mediaType = MediaType.video;
  } else if (['.png', '.jpg', '.jpeg', '.tiff', '.tif'].includes(extension)) {
    mediaType = MediaType.image;
  } else {
    throw new Error(`Unsupported file type: ${extension}`);
  }

  return { mediaType, extension };
}

/**
 * Validates and ingests a single asset into the system.
 */
export async function ingestAsset(params: {
  brandId: string;
  buffer: Buffer;
  originalFilename: string;
  contentType: string;
}) {
  const { brandId, buffer, originalFilename, contentType } = params;
  const db = getDb();
  const storage = createStorage();
  const assetQueue = createQueue('asset.process');

  const { mediaType, extension } = validateAssetUpload(originalFilename, buffer.length);

  // 2. Generate unique IDs and storage keys
  const assetId = randomUUID();
  const storageKey = `brands/${brandId}/assets/${assetId}${extension}`;

  log.info({ assetId, brandId, storageKey, mediaType }, 'Ingesting asset');

  try {
    // 3. Upload to object storage
    await storage.upload(storageKey, buffer, contentType);
    log.info({ assetId, storageKey }, 'Uploaded to storage');

    // 4. Create Asset record (status: uploaded)
    const [asset] = await db.insert(schema.assets).values({
      id: assetId,
      brand_id: brandId,
      media_type: mediaType,
      original_filename: originalFilename,
      storage_key: storageKey,
      file_size_bytes: buffer.length,
      processing_status: ProcessingStatus.uploaded,
    }).returning();

    log.info({ assetId: asset.id }, 'Created database record');

    // 5. Enqueue asset.process job
    await assetQueue.add('asset.process', {
      assetId: asset.id,
      brandId: asset.brand_id,
    });
    log.info({ assetId: asset.id }, 'Enqueued processing job');

    return asset;
  } catch (error) {
    log.error({ err: error, assetId, brandId }, 'Asset ingestion failed');
    throw error;
  }
}
