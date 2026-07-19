import { describe, it, expect } from 'vitest';
import { toCamel, toSnake, mapRows } from './mappers.js';

describe('toCamel', () => {
  it('converts snake_case keys to camelCase', () => {
    expect(toCamel({ brand_id: '123', tone_description: 'warm' }))
      .toEqual({ brandId: '123', toneDescription: 'warm' });
  });

  it('handles single-word keys unchanged', () => {
    expect(toCamel({ name: 'test', id: '1' }))
      .toEqual({ name: 'test', id: '1' });
  });

  it('handles empty object', () => {
    expect(toCamel({})).toEqual({});
  });

  it('handles deeply nested values without converting them', () => {
    const row = { brand_id: '1', metadata: { some_key: 'val' } };
    const result = toCamel(row);
    expect(result.brandId).toBe('1');
    expect(result.metadata).toEqual({ some_key: 'val' }); // values not converted
  });
});

describe('toSnake', () => {
  it('converts camelCase keys to snake_case', () => {
    expect(toSnake({ brandId: '123', toneDescription: 'warm' }))
      .toEqual({ brand_id: '123', tone_description: 'warm' });
  });

  it('handles single-word keys unchanged', () => {
    expect(toSnake({ name: 'test' })).toEqual({ name: 'test' });
  });

  it('is inverse of toCamel', () => {
    const original = { brand_id: '1', nc_score: 0.85 };
    expect(toSnake(toCamel(original) as Record<string, unknown>)).toEqual(original);
  });
});

describe('mapRows', () => {
  it('maps array of snake_case rows to camelCase', () => {
    const rows = [
      { brand_id: '1', nc_score: 0.8 },
      { brand_id: '2', nc_score: 0.9 },
    ];
    const result = mapRows(rows);
    expect(result).toEqual([
      { brandId: '1', ncScore: 0.8 },
      { brandId: '2', ncScore: 0.9 },
    ]);
  });

  it('handles empty array', () => {
    expect(mapRows([])).toEqual([]);
  });
});
