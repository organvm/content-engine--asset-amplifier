import { describe, it, expect, vi } from 'vitest';
import { analyzeDesign } from './analyzer.js';

vi.mock('sharp', () => {
  const buf = Buffer.alloc(8 * 8 * 3, 0x69);
  const sharpMock = vi.fn().mockReturnValue({
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: vi.fn().mockReturnThis(),
    raw: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(buf),
  });
  return { default: sharpMock };
});

describe('analyzeDesign', () => {
  it('should extract metadata and calculate default focal point', async () => {
    const buffer = Buffer.from('test');
    const result = await analyzeDesign(buffer);

    expect(result.aspectRatio).toBe(800 / 600);
    expect(result.focalPoint).toEqual({ x: 400, y: 300 });
    expect(result.colorPalette.length).toBeGreaterThan(0);
    expect(result.colorPalette[0]).toMatch(/^#[0-9a-f]{6}$/);
  });
});
