import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createLogger } from '@cronus/logger';
import { createStorage } from '@cronus/storage';

const log = createLogger('video-renderer');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedBundleUrl: string | null = null;

export async function getRemotionBundle(): Promise<string> {
  if (cachedBundleUrl) return cachedBundleUrl;

  log.info('Executing remotion bundle for video compositions...');
  const entryPoint = path.resolve(__dirname, './compositions/RemotionRoot.tsx');
  const bundleUrl = await bundle({
    entryPoint,
    onProgress: (progress: number) => log.debug(`Remotion bundle progress: ${progress}%`),
  });

  log.info({ bundleUrl }, 'Remotion bundle complete');
  cachedBundleUrl = bundleUrl;
  return bundleUrl;
}

export interface RenderVideoParams {
  brandId: string;
  compositionId?: string;
  inputProps: Record<string, unknown>;
  outputStorageKey: string;
  onProgress?: (percent: number) => void;
}

export async function renderBrollComposite(params: RenderVideoParams): Promise<{ storageKey: string }> {
  const { compositionId = 'BRollComposite', inputProps, outputStorageKey, onProgress } = params;

  const storage = createStorage();
  const serveUrl = await getRemotionBundle();

  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: inputProps,
  });

  const tempOutputPath = path.join('/tmp', `remotion-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);

  log.info({ compositionId, tempOutputPath }, 'Starting Remotion renderMedia');

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: tempOutputPath,
    inputProps: inputProps,
    onProgress: ({ progress }) => {
      const percent = Math.round(progress * 100);
      if (onProgress) onProgress(percent);
    },
  });

  log.info({ tempOutputPath }, 'Remotion video render complete. Uploading to storage...');
  const videoBuffer = await fs.readFile(tempOutputPath);
  await storage.upload(outputStorageKey, videoBuffer, 'video/mp4');
  await fs.unlink(tempOutputPath).catch(() => {});

  log.info({ outputStorageKey }, 'Video composite uploaded to storage successfully');
  return { storageKey: outputStorageKey };
}

export const renderVideoComposite = renderBrollComposite;
