import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAssetFragments } from './index.js';
import { getDb, schema, eq, and } from '@cronus/db';
import { extractVideoFragments } from './video.js';
import { extractImageFragments } from './image.js';
import { transcribeAndExtractHooks } from './transcription.js';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: { assets: { id: 'asset_id' }, fragments: { asset_id: 'frag_asset_id', type: 'type' } },
  eq: vi.fn(),
  and: vi.fn(),
}));

vi.mock('./video.js', () => ({ extractVideoFragments: vi.fn() }));
vi.mock('./image.js', () => ({ extractImageFragments: vi.fn() }));
vi.mock('./transcription.js', () => ({ transcribeAndExtractHooks: vi.fn() }));

describe('processAssetFragments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if asset not found', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    await expect(processAssetFragments('123')).rejects.toThrow('Asset not found: 123');
  });

  it('should extract video fragments and transcribe', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) });
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => {
          if (table === schema.assets) {
            return { where: vi.fn().mockResolvedValue([{ id: 'a', media_type: 'video', brand_id: 'b', storage_key: 's' }]) };
          }
          if (table === schema.fragments) {
             return { where: vi.fn().mockResolvedValue([{ storage_key: 'audio' }]) };
          }
        })
      })),
      update: mockUpdate
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    await processAssetFragments('a');

    expect(extractVideoFragments).toHaveBeenCalled();
    expect(transcribeAndExtractHooks).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(2); // processing, then extracted
  });
  
  it('should extract image fragments', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) });
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => {
          if (table === schema.assets) {
            return { where: vi.fn().mockResolvedValue([{ id: 'a', media_type: 'image', brand_id: 'b', storage_key: 's' }]) };
          }
          if (table === schema.fragments) {
             return { where: vi.fn().mockResolvedValue([]) };
          }
        })
      })),
      update: mockUpdate
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    await processAssetFragments('a');

    expect(extractImageFragments).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });
  
  it('should mark as failed on error', async () => {
    const mockUpdateSetWhere = vi.fn();
    const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: mockUpdateSetWhere }) });
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => {
           return { where: vi.fn().mockResolvedValue([{ id: 'a', media_type: 'image', brand_id: 'b', storage_key: 's' }]) };
        })
      })),
      update: mockUpdate
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);
    
    vi.mocked(extractImageFragments).mockRejectedValue(new Error('fail'));

    await expect(processAssetFragments('a')).rejects.toThrow('fail');
    expect(mockUpdateSetWhere).toHaveBeenCalled();
  });
});
