import { describe, it, expect } from 'vitest';
import { findDuplicateContentUnits } from './dedup.js';

describe('deduplicateContentUnits', () => {
  it('should identify duplicate captions on the same platform', () => {
    const units = [
      { id: 'u1', platform: 'instagram_feed', caption: 'Exploring AI instruments', mediaKey: 'k1' },
      { id: 'u2', platform: 'instagram_feed', caption: 'Exploring AI instruments', mediaKey: 'k2' },
    ];

    const duplicates = findDuplicateContentUnits(units);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe('u2');
    expect(duplicates[0].reason).toContain('Duplicate caption');
  });

  it('should identify duplicate media keys on the same platform', () => {
    const units = [
      { id: 'u1', platform: 'linkedin', caption: 'Deconstructing autonomous media', mediaKey: 'k1' },
      { id: 'u2', platform: 'linkedin', caption: 'A deep dive into media instruments', mediaKey: 'k1' },
    ];

    const duplicates = findDuplicateContentUnits(units);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe('u2');
    expect(duplicates[0].reason).toContain('Duplicate media key');
  });

  it('should allow identical captions across different platforms', () => {
    const units = [
      { id: 'u1', platform: 'instagram_feed', caption: 'Exploring AI instruments', mediaKey: 'k1' },
      { id: 'u2', platform: 'linkedin', caption: 'Exploring AI instruments', mediaKey: 'k2' },
    ];

    const duplicates = findDuplicateContentUnits(units);
    expect(duplicates).toHaveLength(0);
  });
});
