import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStorage } from '@cronus/storage';
import { getDb, schema } from '@cronus/db';
import { createQueue } from '@cronus/queue';
import { MediaType, ProcessingStatus } from '@cronus/domain';
import { createLogger } from '@cronus/logger';

const log = createLogger('asset-ingestion');

/**
 * Validates and ingests a single asset into the system.
 * 
 * 1. Validates media type and file size.
 * 2. Uploads to object storage.
 * 3. Creates Asset record in the database.
 * 4. Enqueues a background job for processing (fragment extraction).
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

  // 1. Validate file type/size (FR-001: MP4/MOV/PNG/JPG/TIFF, ≤2GB)
  // Max size check (2GB)
  const MAX_SIZE = 2 * 1024 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    throw new Error('File size exceeds 2GB limit');
  }

  const extension = path.extname(originalFilename).toLowerCase();
  let mediaType: MediaType;

  if (['.mp4', '.mov'].includes(extension)) {
    mediaType = MediaType.video;
  } else if (['.png', '.jpg', '.jpeg', '.tiff', '.tif'].includes(extension)) {
    mediaType = MediaType.image;
  } else {
    log.warn({ extension, originalFilename }, 'Unsupported file extension');
    throw new Error(`Unsupported file type: ${extension}`);
  }

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
