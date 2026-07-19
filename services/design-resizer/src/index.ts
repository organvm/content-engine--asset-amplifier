import { createStorage } from '@cronus/storage';
import { analyzeDesign } from './analyzer.js';
import { resizeToFormat } from './resizer.js';
import { getFormat, DESIGN_FORMATS } from './formats.js';
import { createLogger } from '@cronus/logger';
import { randomUUID } from 'node:crypto';

const log = createLogger('design-resizer');

/**
 * Orchestrates the multi-format resizing process.
 */
export async function resizeDesignBatch(params: {
  brandId: string;
  buffer: Buffer;
  originalFilename: string;
  targetFormatIds: string[];
}) {
  const { brandId, buffer, originalFilename, targetFormatIds } = params;
  const storage = createStorage();
  
  log.info({ brandId, originalFilename, formats: targetFormatIds }, 'Starting design resizing batch');

  // 1. Analyze source
  const analysis = await analyzeDesign(buffer);

  const results = [];

  for (const formatId of targetFormatIds) {
    const format = getFormat(formatId);
    if (!format) {
      log.warn({ formatId }, 'Unsupported format requested, skipping');
      continue;
    }

    try {
      // 2. Resize
      const resizedBuffer = await resizeToFormat({ buffer, format, analysis });

      // 3. Upload
      const variantId = randomUUID();
      const extension = originalFilename.split('.').pop() || 'png';
      const storageKey = `brands/${brandId}/designs/${variantId}.${extension}`;
      
      await storage.upload(storageKey, resizedBuffer, `image/${extension}`);

      results.push({
        formatId,
        storageKey,
        variantId
      });

      log.debug({ formatId }, 'Generated variant');

    } catch (err) {
      log.error({ err, formatId }, 'Failed to generate variant');
    }
  }

  return results;
}

export { DESIGN_FORMATS, getFormat };
