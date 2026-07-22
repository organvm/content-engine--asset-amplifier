/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcribeAndExtractHooks } from './transcription.js';
import { getDb } from '@cronus/db';
import { createStorage } from '@cronus/storage';
import { resolveProviders } from '@cronus/config';
import fsp from 'node:fs/promises';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: { assets: { id: 'asset-id-col' }, fragments: 'fragments' },
  eq: vi.fn(),
}));

vi.mock('@cronus/storage', () => ({
  createStorage: vi.fn(),
}));

vi.mock('@cronus/config', () => ({
  resolveProviders: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
  }
}));

describe('transcribeAndExtractHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip if no provider', async () => {
    vi.mocked(resolveProviders).mockResolvedValue({ transcription: null } as any);
    const mockUpdate = vi.fn();
    vi.mocked(getDb).mockReturnValue({ update: mockUpdate } as any);
    await transcribeAndExtractHooks({ assetId: 'a', audioStorageKey: 'b' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should transcribe and extract hooks', async () => {
    const mockTranscribe = vi.fn().mockResolvedValue('This is a short hook. This is a longer hook that should definitely be extracted as a text fragment because it meets length requirements.');
    vi.mocked(resolveProviders).mockResolvedValue({
      transcription: { name: 'mock', transcribe: mockTranscribe }
    } as any);

    const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) });
    const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) });
    vi.mocked(getDb).mockReturnValue({ update: mockUpdate, insert: mockInsert } as any);

    const mockStorage = { download: vi.fn().mockResolvedValue(Buffer.from('audio')) };
    vi.mocked(createStorage).mockReturnValue(mockStorage as any);

    await transcribeAndExtractHooks({ assetId: 'a', audioStorageKey: 'b' });

    expect(mockTranscribe).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    // One sentence > 30 chars
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(fsp.unlink).toHaveBeenCalled();
  });
});
