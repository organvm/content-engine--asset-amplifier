import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatMedia } from './formatter.js';
import { Platform } from '@cronus/domain';
import { createStorage } from '@cronus/storage';

// Mock dependencies
vi.mock('@cronus/storage', () => ({
  createStorage: vi.fn(),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('sharp', () => {
  const sharpMock = vi.fn().mockReturnValue({
    resize: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('image buffer')),
  });
  return { default: sharpMock };
});

vi.mock('node:fs', () => ({
  default: {
    promises: {
      writeFile: vi.fn(),
      readFile: vi.fn().mockResolvedValue(Buffer.from('video buffer')),
      unlink: vi.fn().mockResolvedValue(undefined),
    }
  }
}));

vi.mock('fluent-ffmpeg', () => {
  return {
    default: vi.fn().mockReturnValue({
      videoFilters: vi.fn().mockReturnThis(),
      outputOptions: vi.fn().mockReturnThis(),
      save: vi.fn().mockReturnThis(),
      on: vi.fn(function(this: any, event: string, cb: any) {
        if (event === 'end') setTimeout(cb, 0); // trigger success immediately
        return this;
      }),
    })
  };
});

describe('formatMedia', () => {
  let storageMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    storageMock = {
      download: vi.fn().mockResolvedValue(Buffer.from('mock buffer')),
      upload: vi.fn().mockResolvedValue(undefined),
    };
    (createStorage as any).mockReturnValue(storageMock);
  });

  it('should format an image media type', async () => {
    const key = await formatMedia({
      storageKey: 'test.jpg',
      platform: Platform.instagram_feed,
      mediaType: 'image',
      brandId: 'brand-1'
    });

    expect(storageMock.download).toHaveBeenCalledWith('test.jpg');
    expect(storageMock.upload).toHaveBeenCalledWith(
      'brands/brand-1/formatted/instagram_feed/test.jpg',
      expect.any(Buffer),
      'image/jpeg'
    );
    expect(key).toBe('brands/brand-1/formatted/instagram_feed/test.jpg');
  });

  it('should bypass formatting and return original key for unknown media type', async () => {
    const key = await formatMedia({
      storageKey: 'test.unknown',
      platform: Platform.instagram_feed,
      mediaType: 'unknown' as any,
      brandId: 'brand-1'
    });
    expect(key).toBe('test.unknown');
    expect(storageMock.upload).not.toHaveBeenCalled();
  });
});
