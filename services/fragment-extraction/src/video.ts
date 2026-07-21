import ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { createStorage } from '@cronus/storage';
import { getDb, schema } from '@cronus/db';
import { FragmentType } from '@cronus/domain';
import { createLogger } from '@cronus/logger';

const log = createLogger('fragment-extraction:video');

/**
 * Extracts fragments from a video asset.
 * 
 * - Probes video metadata with ffprobe for accurate duration.
 * - Extracts audio track for transcription.
 * - Extracts keyframes at calculated intervals across duration.
 * - Extracts clips from start, middle, and end.
 */
export async function extractVideoFragments(params: {
  assetId: string;
  brandId: string;
  storageKey: string;
}) {
  const { assetId, brandId, storageKey } = params;
  const db = getDb();
  const storage = createStorage();
  
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `cronus-video-${assetId}-`));
  const inputPath = path.join(tmpDir, 'input.mp4');

  log.info({ assetId, tmpDir }, 'Starting video fragment extraction');

  try {
    // 1. Download asset to local disk for processing
    const buffer = await storage.download(storageKey);
    await fs.writeFile(inputPath, buffer);

    // Probe duration using ffprobe
    let durationSeconds = 30; // fallback default
    try {
      const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      if (metadata.format && typeof metadata.format.duration === 'number') {
        durationSeconds = Math.max(5, Math.floor(metadata.format.duration));
      }
    } catch {
      log.warn({ assetId }, 'ffprobe duration probe failed, using 30s default');
    }

    log.info({ assetId, durationSeconds }, 'Probed video duration');

    // 2. Extract Audio (for transcription)
    const audioFilename = 'audio.mp3';
    const audioLocalPath = path.join(tmpDir, audioFilename);
    const audioStorageKey = `brands/${brandId}/fragments/${assetId}/audio.mp3`;

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(audioLocalPath);
    });

    const audioBuffer = await fs.readFile(audioLocalPath);
    await storage.upload(audioStorageKey, audioBuffer, 'audio/mpeg');
    
    await db.insert(schema.fragments).values({
      id: randomUUID(),
      asset_id: assetId,
      type: FragmentType.audio_segment,
      storage_key: audioStorageKey,
      quality_score: 1.0,
      extraction_metadata: { codec: 'mp3', durationSeconds },
    });

    // 3. Extract Keyframes (thumbnails) at 5 evenly spaced intervals
    const keyframeTimestamps = Array.from({ length: 5 }, (_, i) =>
      Math.floor((i / 4) * (durationSeconds * 0.9))
    );
    
    for (const ts of keyframeTimestamps) {
      const kfId = randomUUID();
      const kfFilename = `kf-${kfId}.jpg`;
      const kfLocalPath = path.join(tmpDir, kfFilename);
      const kfStorageKey = `brands/${brandId}/fragments/${assetId}/${kfFilename}`;

      try {
        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .screenshots({
              timestamps: [ts],
              filename: kfFilename,
              folder: tmpDir,
              size: '1280x?'
            })
            .on('end', resolve)
            .on('error', reject);
        });

        const kfBuffer = await fs.readFile(kfLocalPath);
        await storage.upload(kfStorageKey, kfBuffer, 'image/jpeg');

        await db.insert(schema.fragments).values({
          id: kfId,
          asset_id: assetId,
          type: FragmentType.keyframe,
          storage_key: kfStorageKey,
          start_time: ts,
          quality_score: 0.8,
          extraction_metadata: { timestamp: ts },
        });
      } catch (err) {
        log.warn({ err, ts }, 'Failed to extract keyframe, skipping');
      }
    }

    // 4. Extract Clips (dynamically calculated for short vs long video)
    const clipDuration = Math.min(10, Math.floor(durationSeconds / 3));
    const clips = [
      { start: 0, duration: clipDuration, label: 'intro' },
      { start: Math.floor(durationSeconds / 2), duration: clipDuration, label: 'middle' },
    ];

    for (const clipSpec of clips) {
      const clipId = randomUUID();
      const clipFilename = `clip-${clipId}.mp4`;
      const clipLocalPath = path.join(tmpDir, clipFilename);
      const clipStorageKey = `brands/${brandId}/fragments/${assetId}/${clipFilename}`;

      try {
        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .setStartTime(clipSpec.start)
            .setDuration(clipSpec.duration)
            .on('end', resolve)
            .on('error', reject)
            .save(clipLocalPath);
        });

        const clipBuffer = await fs.readFile(clipLocalPath);
        await storage.upload(clipStorageKey, clipBuffer, 'video/mp4');

        await db.insert(schema.fragments).values({
          id: clipId,
          asset_id: assetId,
          type: FragmentType.clip,
          storage_key: clipStorageKey,
          start_time: clipSpec.start,
          end_time: clipSpec.start + clipSpec.duration,
          quality_score: 0.9,
          extraction_metadata: { ...clipSpec },
        });
      } catch (err) {
        log.warn({ err, clipSpec }, 'Failed to extract clip, skipping');
      }
    }

    log.info({ assetId }, 'Successfully extracted fragments from video');
  } catch (error) {
    log.error({ err: error, assetId }, 'Video fragment extraction failed');
    throw error;
  } finally {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
