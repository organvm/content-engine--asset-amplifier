import { describe, it, expect, vi } from 'vitest';
import { analyzeDesign } from './analyzer.js';

vi.mock('sharp', () => {
  const sharpMock = vi.fn().mockReturnValue({
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
  });
  return { default: sharpMock };
});

describe('analyzeDesign', () => {
  it('should extract metadata and calculate default focal point', async () => {
    const buffer = Buffer.from('test');
    const result = await analyzeDesign(buffer);

    expect(result.aspectRatio).toBe(800 / 600);
    expect(result.focalPoint).toEqual({ x: 400, y: 300 });
    expect(result.colorPalette).toEqual([]);
  });
});
