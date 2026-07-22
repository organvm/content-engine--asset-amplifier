/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractImageFragments } from './image.js';
import { getDb } from '@cronus/db';
import { createStorage } from '@cronus/storage';
import sharp from 'sharp';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: { fragments: 'fragments' },
}));

vi.mock('@cronus/storage', () => ({
  createStorage: vi.fn(),
}));

vi.mock('sharp', () => ({
  default: vi.fn(),
}));

describe('extractImageFragments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process image and extract fragments', async () => {
    // Setup mocks
    const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) });
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as any);

    const mockStorage = {
      download: vi.fn().mockResolvedValue(Buffer.from('test')),
      upload: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(createStorage).mockReturnValue(mockStorage as any);

    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({ width: 2000, height: 2000, format: 'jpg' }),
      resize: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('cropped')),
    };
    
    // sharp mock
    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    // sharp.strategy.entropy
    (sharp as any).strategy = { entropy: 'entropy' };

    await extractImageFragments({
      assetId: 'asset-1',
      brandId: 'brand-1',
      storageKey: 'key-1'
    });

    expect(mockStorage.download).toHaveBeenCalledWith('key-1');
    expect(mockSharpInstance.resize).toHaveBeenCalledTimes(4); // 4 targets
    expect(mockStorage.upload).toHaveBeenCalledTimes(4);
    expect(mockInsert).toHaveBeenCalledTimes(4);
  });
  
  it('should throw if metadata is missing dimensions', async () => {
    vi.mocked(getDb).mockReturnValue({} as any);
    const mockStorage = { download: vi.fn().mockResolvedValue(Buffer.from('test')) };
    vi.mocked(createStorage).mockReturnValue(mockStorage as any);

    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    
    await expect(extractImageFragments({
      assetId: 'asset-1',
      brandId: 'brand-1',
      storageKey: 'key-1'
    })).rejects.toThrow('Could not read image metadata');
  });
});
