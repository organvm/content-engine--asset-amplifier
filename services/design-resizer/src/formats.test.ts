import { describe, it, expect } from 'vitest';
import { DESIGN_FORMATS, getFormat } from './formats.js';

describe('@cronus/design-resizer formats', () => {
  it('should list all predefined design formats', () => {
    expect(DESIGN_FORMATS).toHaveLength(9);
    const platforms = new Set(DESIGN_FORMATS.map(f => f.platform));
    expect(platforms.has('instagram')).toBe(true);
    expect(platforms.has('linkedin')).toBe(true);
    expect(platforms.has('x')).toBe(true);
  });

  it('should retrieve format by exact ID', () => {
    const format = getFormat('instagram_story_1080x1920');
    expect(format).toBeDefined();
    expect(format?.width).toBe(1080);
    expect(format?.height).toBe(1920);
    expect(format?.aspectRatio).toBeCloseTo(9 / 16, 2);
  });

  it('should return undefined for unknown format IDs', () => {
    const format = getFormat('invalid_format_id');
    expect(format).toBeUndefined();
  });
});
