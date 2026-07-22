/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { resizeToFormat } from './resizer.js';

vi.mock('sharp', () => {
  const sharpMock = vi.fn().mockReturnValue({
    resize: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized buffer')),
  });
  (sharpMock as any).strategy = { entropy: 'entropy' };
  return { default: sharpMock };
});

describe('resizeToFormat', () => {
  it('should resize image based on format', async () => {
    const buffer = Buffer.from('original buffer');
    const result = await resizeToFormat({
      buffer,
      format: { width: 100, height: 200 } as any,
      analysis: {} as any
    });

    expect(result).toEqual(Buffer.from('resized buffer'));
  });
});
