/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deriveNaturalCenter } from './derive.js';
import { getDb, schema } from '@cronus/db';
import { resolveProviders } from '@cronus/config';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: { fragments: { asset_id: 'asset_id', type: 'type' }, assets: { id: 'id' }, naturalCenters: { brand_id: 'brand_id', version: 'version' } },
  inArray: vi.fn(),
  and: vi.fn(),
  eq: vi.fn(),
  sql: vi.fn(),
}));

vi.mock('@cronus/config', () => ({
  resolveProviders: vi.fn(),
}));

vi.mock('./inquiry.js', () => ({
  generateIdentityInquiries: vi.fn().mockResolvedValue([]),
}));

describe('deriveNaturalCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if no LLM provider', async () => {
    vi.mocked(resolveProviders).mockResolvedValue({ llm: null } as any);
    await expect(deriveNaturalCenter({ brandId: 'b', assetIds: [] })).rejects.toThrow('No LLM provider available');
  });

  it('should derive natural center using LLM', async () => {
    const mockLlm = {
      generate: vi.fn().mockResolvedValue('{"thematic_core":{"primary":"p","secondary":"s"},"aesthetic_signature":"a","tonal_vector":"t","narrative_bias":"n","symbolic_markers":["s"],"negative_space":["n"],"summary":"sum"}')
    };
    const mockEmbedding = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2])
    };
    vi.mocked(resolveProviders).mockResolvedValue({ llm: mockLlm, embedding: mockEmbedding } as any);

    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => {
          if (table === schema.fragments) {
            return { where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) };
          }
          if (table === schema.assets) {
            return { where: vi.fn().mockResolvedValue([{ transcription: 'hello world' }]) };
          }
        })
      })),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'nc-id' }])
          })
        })
      })
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    const result = await deriveNaturalCenter({ brandId: 'b', assetIds: ['a'] });
    expect(result).toEqual({ id: 'nc-id' });
    expect(mockLlm.generate).toHaveBeenCalled();
    expect(mockEmbedding.embed).toHaveBeenCalled();
  });
  
  it('should fallback to defaults if LLM returns invalid JSON', async () => {
     const mockLlm = {
      generate: vi.fn().mockResolvedValue('invalid response without json')
    };
    vi.mocked(resolveProviders).mockResolvedValue({ llm: mockLlm, embedding: { embed: vi.fn() } } as any);
    
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => {
          if (table === schema.fragments) {
            return { where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) };
          }
          if (table === schema.assets) {
            return { where: vi.fn().mockResolvedValue([]) };
          }
        })
      })),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'nc-id' }])
          })
        })
      })
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    await deriveNaturalCenter({ brandId: 'b', assetIds: ['a'] });
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
