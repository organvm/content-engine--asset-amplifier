import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAsset } from './asset.js';
import { processAssetFragments } from '@cronus/fragment-extraction';
import { createQueue, JobPayloads } from '@cronus/queue';
import { Platform } from '@cronus/domain';

const mockAdd = vi.fn();

vi.mock('@cronus/fragment-extraction', () => ({
  processAssetFragments: vi.fn(),
}));

vi.mock('@cronus/queue', () => ({
  createQueue: vi.fn(() => ({
    add: mockAdd,
  })),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('asset processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process asset fragments and enqueue content generation', async () => {
    const data: JobPayloads['asset.process'] = {
      brandId: 'brand-123',
      assetId: 'asset-456',
    };

    await processAsset(data);

    expect(processAssetFragments).toHaveBeenCalledWith('asset-456');
    expect(createQueue).toHaveBeenCalledWith('content.generate');
    expect(mockAdd).toHaveBeenCalledWith('content.generate', {
      brandId: 'brand-123',
      assetId: 'asset-456',
      platforms: [
        Platform.instagram_feed,
        Platform.instagram_reels,
        Platform.linkedin,
        Platform.x,
        Platform.tiktok,
      ],
      postsPerFragment: 1,
    });
  });
});
