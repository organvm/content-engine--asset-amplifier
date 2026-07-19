import { Platform } from '@cronus/domain';
import sharp from 'sharp';
import path from 'node:path';
import { createStorage } from '@cronus/storage';
import { createLogger } from '@cronus/logger';

const log = createLogger('content-generation:formatter');

/**
 * Format specifications per platform.
 */
export const PLATFORM_SPECS: Record<Platform, { aspect_ratio: number; width: number; height: number; type: 'video' | 'image' }> = {
  [Platform.instagram_feed]: { aspect_ratio: 1, width: 1080, height: 1080, type: 'image' },
  [Platform.instagram_story]: { aspect_ratio: 9/16, width: 1080, height: 1920, type: 'image' },
  [Platform.instagram_reels]: { aspect_ratio: 9/16, width: 1080, height: 1920, type: 'video' },
  [Platform.linkedin]: { aspect_ratio: 1.91/1, width: 1200, height: 627, type: 'image' },
  [Platform.tiktok]: { aspect_ratio: 9/16, width: 1080, height: 1920, type: 'video' },
  [Platform.youtube_shorts]: { aspect_ratio: 9/16, width: 1080, height: 1920, type: 'video' },
  [Platform.x]: { aspect_ratio: 16/9, width: 1200, height: 675, type: 'image' },
};

/**
 * Ensures media matches the platform's required format.
 */
export async function formatMedia(params: {
  storageKey: string;
  platform: Platform;
  mediaType: 'video' | 'image';
  brandId: string;
}) {
  const { storageKey, platform, mediaType, brandId } = params;
  const spec = PLATFORM_SPECS[platform];
  const storage = createStorage();
  
  log.info({ platform, storageKey }, 'Formatting media for platform');

  // If the target platform expects a different media type than the fragment,
  // we might need more complex logic. For MVP, we assume compatible types.
  
  if (mediaType === 'image') {
    const buffer = await storage.download(storageKey);
    const formattedBuffer = await sharp(buffer)
      .resize(spec.width, spec.height, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    const newKey = `brands/${brandId}/formatted/${platform}/${path.basename(storageKey)}`;
    await storage.upload(newKey, formattedBuffer, 'image/jpeg');
    return newKey;
  }

  if (mediaType === 'video') {
    // For video, we might need FFmpeg to re-encode/pad/crop.
    // For MVP, if it's already a clip, we just return the original key
    // unless we strictly need to re-encode.
    // TODO: Implement FFmpeg padding/cropping if aspect ratios don't match.
    return storageKey; 
  }

  return storageKey;
}
