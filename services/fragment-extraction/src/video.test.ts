/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractVideoFragments } from './video.js';
import { getDb } from '@cronus/db';
import { createStorage } from '@cronus/storage';
import fs from 'node:fs/promises';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: { fragments: 'fragments' },
}));

vi.mock('@cronus/storage', () => ({
  createStorage: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {
    mkdtemp: vi.fn().mockResolvedValue('/tmp/video-test-dir'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
    rm: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('fluent-ffmpeg', () => {
  const fluentFfmpegMock = vi.fn().mockImplementation(() => {
    return {
      toFormat: vi.fn().mockReturnThis(),
      on: vi.fn().mockImplementation(function(this: any, event: string, cb: Function) {
        if (event === 'end') setTimeout(cb, 0); // trigger success
        return this;
      }),
      save: vi.fn().mockReturnThis(),
      screenshots: vi.fn().mockReturnThis(),
      setStartTime: vi.fn().mockReturnThis(),
      setDuration: vi.fn().mockReturnThis(),
    };
  });
  
  (fluentFfmpegMock as any).ffprobe = vi.fn().mockImplementation((path: string, cb: Function) => {
    cb(null, { format: { duration: 60 } });
  });
  
  return { default: fluentFfmpegMock };
});

describe('extractVideoFragments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process video and extract audio, keyframes, clips', async () => {
    const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) });
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as any);

    const mockStorage = {
      download: vi.fn().mockResolvedValue(Buffer.from('video-file')),
      upload: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(createStorage).mockReturnValue(mockStorage as any);

    await extractVideoFragments({
      assetId: 'asset-1',
      brandId: 'brand-1',
      storageKey: 'key-1'
    });

    expect(fs.mkdtemp).toHaveBeenCalled();
    expect(mockStorage.download).toHaveBeenCalledWith('key-1');
    expect(fs.writeFile).toHaveBeenCalled();
    
    // Audio (1) + Keyframes (5) + Clips (2) = 8 uploads
    expect(mockStorage.upload).toHaveBeenCalledTimes(8);
    expect(mockInsert).toHaveBeenCalledTimes(8);
    
    expect(fs.rm).toHaveBeenCalledWith('/tmp/video-test-dir', { recursive: true, force: true });
  });
});
