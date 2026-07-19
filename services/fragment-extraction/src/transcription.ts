import { resolveProviders } from '@cronus/config';
import { getDb, schema } from '@cronus/db';
import { eq } from '@cronus/db';
import { FragmentType } from '@cronus/domain';
import { randomUUID } from 'node:crypto';
import { createLogger } from '@cronus/logger';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createStorage } from '@cronus/storage';

const log = createLogger('fragment-extraction:transcription');

/**
 * Transcribes audio via the provider abstraction and extracts text hooks.
 *
 * 1. Resolves a transcription provider (Groq Whisper, OpenAI, etc.).
 * 2. Downloads audio from storage to a tmp file.
 * 3. Calls provider.transcribe(tmpFile).
 * 4. Updates Asset record with full transcript.
 * 5. Extracts quotable "hooks" as fragments.
 *
 * If no transcription provider is configured, logs info and returns
 * without throwing — the orchestrator continues without text_hook fragments.
 */
export async function transcribeAndExtractHooks(params: {
  assetId: string;
  audioStorageKey: string;
}) {
  const { assetId, audioStorageKey } = params;
  const { transcription: provider } = await resolveProviders();
  const db = getDb();
  const storage = createStorage();

  if (!provider) {
    log.info('No transcription provider available, skipping');
    return;
  }

  const tmpFile = path.join(os.tmpdir(), `audio-${assetId}.mp3`);

  log.info({ assetId, provider: provider.name }, 'Starting transcription');

  try {
    // 1. Download audio buffer
    const audioBuffer = await storage.download(audioStorageKey);
    await fsp.writeFile(tmpFile, audioBuffer);

    // 2. Transcribe via provider abstraction
    const text = await provider.transcribe(tmpFile);

    log.info({ assetId }, 'Transcription complete');

    // 3. Update Asset with full transcription
    await db.update(schema.assets)
      .set({ transcription: text })
      .where(eq(schema.assets.id, assetId));

    // 4. Extract text hooks (sentences)
    // Simple sentence-based extraction for MVP
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 30 && s.length < 280); // Sensible lengths for hooks

    for (const sentence of sentences) {
      await db.insert(schema.fragments).values({
        id: randomUUID(),
        asset_id: assetId,
        type: FragmentType.text_hook,
        storage_key: 'text://' + assetId, // Marker for text-only fragments
        description: sentence,
        quality_score: 1.0,
        extraction_metadata: {
          source: provider.name,
          char_count: sentence.length
        },
      });
    }

    log.info({ assetId, hook_count: sentences.length }, 'Successfully extracted text hooks');
  } catch (error) {
    log.error({ err: error, assetId }, 'Transcription failed');
    throw error;
  } finally {
    // Cleanup local tmp file
    if (fs.existsSync(tmpFile)) {
      await fsp.unlink(tmpFile).catch(() => {});
    }
  }
}
