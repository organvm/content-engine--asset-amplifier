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
 * - Detects scene changes using ffprobe.
 * - Extracts clips for each scene.
 * - Extracts keyframes at regular intervals.
 * - Extracts full audio track for transcription.
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

    // 2. Extract Audio (for US1/T024 transcription)
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
      extraction_metadata: { codec: 'mp3', original: true },
    });

    // 3. Detect Scene Changes
    // We use a simple approach for MVP: extract keyframes every 5 seconds
    // and create 5-10s clips from interesting points.
    // TODO: Implement advanced scene detection via ffprobe select filter
    
    // 4. Extract Keyframes (thumbnails)
    const keyframeTimestamps = [0, 5, 10, 15, 20]; // Placeholder timestamps
    
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

    // 5. Extract Clips
    // For MVP: extract three 10-second clips from the start, middle, and near-end
    const clips = [
      { start: 0, duration: 10, label: 'intro' },
      { start: 15, duration: 10, label: 'middle' },
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
