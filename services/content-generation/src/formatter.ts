import { Platform } from '@cronus/domain';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import ffmpeg from 'fluent-ffmpeg';
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
}): Promise<string> {
  const { storageKey, platform, mediaType, brandId } = params;
  const spec = PLATFORM_SPECS[platform];
  const storage = createStorage();
  
  log.info({ platform, storageKey }, 'Formatting media for platform');

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
    // If FFmpeg is available locally (Node runtime), scale/pad video to target dimensions
    try {
      const buffer = await storage.download(storageKey);
      const tmpDir = os.tmpdir();
      const inputPath = path.join(tmpDir, `input_${Date.now()}_${path.basename(storageKey)}`);
      const outputPath = path.join(tmpDir, `output_${Date.now()}_${path.basename(storageKey)}.mp4`);

      await fs.promises.writeFile(inputPath, buffer);

      // Crop to target aspect ratio rather than padding with black bars
      const vfFilter = `scale=${spec.width}:${spec.height}:force_original_aspect_ratio=increase,crop=${spec.width}:${spec.height}`;

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters(vfFilter)
          .outputOptions('-c:a copy')
          .save(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      const formattedVideoBuffer = await fs.promises.readFile(outputPath);
      const newKey = `brands/${brandId}/formatted/${platform}/${path.basename(storageKey)}.mp4`;
      await storage.upload(newKey, formattedVideoBuffer, 'video/mp4');

      // Cleanup
      await fs.promises.unlink(inputPath).catch(() => {});
      await fs.promises.unlink(outputPath).catch(() => {});

      log.info({ platform, newKey }, 'Video re-encoded and formatted successfully');
      return newKey;

    } catch (err) {
      log.warn({ err, storageKey }, 'FFmpeg video re-encoding fallback (returning original key)');
      return storageKey;
    }
  }

  return storageKey;
}
