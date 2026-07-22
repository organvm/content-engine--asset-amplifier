import { JobPayloads } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { getDb, schema, eq } from '@cronus/db';
import { renderBrollComposite } from '@cronus/video-renderer';

const logger = createLogger('processor:render-video');

export async function processRenderVideo(data: JobPayloads['render.video']): Promise<void> {
  const { brandId, assetId, fragmentId, headline, watermark } = data;
  logger.info({ brandId, assetId, fragmentId }, 'Starting video render...');

  const db = getDb();

  const [fragment] = await db
    .select()
    .from(schema.fragments)
    .where(eq(schema.fragments.id, fragmentId));

  if (!fragment) {
    throw new Error(`Fragment not found: ${fragmentId}`);
  }

  const storageKey = fragment.storage_key;
  if (!storageKey) {
    throw new Error(`Fragment ${fragmentId} has no storage key`);
  }

  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  const bRollVideoUrl = `${apiUrl}/files/${storageKey}`;
  const outputStorageKey = `brands/${brandId}/rendered-videos/${assetId}.mp4`;

  const result = await renderBrollComposite({
    brandId,
    inputProps: {
      bRollVideoUrl,
      headlineText: headline ?? '',
      watermarkText: watermark ?? '',
    },
    outputStorageKey,
  });

  const updateData: Record<string, unknown> = {
    rendered_video_key: result.storageKey,
    processing_status: 'rendered',
  };
  await db
    .update(schema.assets)
    .set(updateData)
    .where(eq(schema.assets.id, assetId));

  logger.info({ brandId, assetId, videoKey: result.storageKey }, 'Video render completed');
}
