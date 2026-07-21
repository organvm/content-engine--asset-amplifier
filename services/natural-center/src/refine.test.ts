import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refineNaturalCenter } from './refine.js';
import { getDb, schema, eq, sql } from '@cronus/db';
import * as promptLib from './prompt.js';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: { naturalCenters: { brand_id: 'nc_brand_id', id: 'nc_id', version: 'version' }, brands: { id: 'brand_id' } },
  eq: vi.fn(),
  sql: vi.fn(),
}));

vi.mock('./prompt.js', () => ({
  compileSystemPrompt: vi.fn().mockReturnValue('mock-prompt'),
}));

describe('refineNaturalCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if no identity found', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]) // no NC
        })
      })
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    await expect(refineNaturalCenter({ brandId: 'b', adjustments: {} })).rejects.toThrow('No identity profile found');
  });

  it('should refine identity and update db', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true)
      })
    });
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => {
          if (table === schema.naturalCenters) {
            return { where: vi.fn().mockResolvedValue([{ id: 'nc1', tonal_vector: 'old', version: 1 }]) };
          }
          if (table === schema.brands) {
            return { where: vi.fn().mockResolvedValue([{ id: 'b', name: 'BrandName' }]) };
          }
        })
      })),
      update: mockUpdate
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    await refineNaturalCenter({ brandId: 'b', adjustments: { tonal_vector: 'new' } });

    expect(promptLib.compileSystemPrompt).toHaveBeenCalledWith(expect.objectContaining({
      brandName: 'BrandName',
      tonalVector: 'new'
    }));
    expect(mockUpdate).toHaveBeenCalled();
  });
});
