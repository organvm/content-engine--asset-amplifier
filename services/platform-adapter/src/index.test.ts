import { describe, it, expect } from 'vitest';
import { getAdapter } from './index.js';
import { Platform, PlatformConnectionStatus } from '@cronus/domain';

describe('@cronus/platform-adapter registry and adapters', () => {
  it('should retrieve registered adapter for Instagram Feed', () => {
    const adapter = getAdapter(Platform.instagram_feed);
    expect(adapter.platform).toBe(Platform.instagram_feed);
    expect(adapter.getFormatSpec().minWidth).toBe(1080);
  });

  it('should retrieve registered adapter for LinkedIn', () => {
    const adapter = getAdapter(Platform.linkedin);
    expect(adapter.platform).toBe(Platform.linkedin);
    expect(adapter.getFormatSpec().allowedExtensions).toContain('.mp4');
  });

  it('should retrieve registered adapter for TikTok', () => {
    const adapter = getAdapter(Platform.tiktok);
    expect(adapter.platform).toBe(Platform.tiktok);
    expect(adapter.getFormatSpec().aspectRatio).toBeCloseTo(9 / 16);
  });

  it('should authenticate and simulate publish on TikTok adapter', async () => {
    const adapter = getAdapter(Platform.tiktok);
    const mockConnection = {
      id: 'conn-1',
      brandId: 'brand-1',
      platform: Platform.tiktok,
      platformAccountId: 'user-1',
      status: PlatformConnectionStatus.active,
      accessToken: 'token-123',
      scopes: [],
      rateLimitState: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const isAuthed = await adapter.authenticate(mockConnection);
    expect(isAuthed).toBe(true);

    const publishResult = await adapter.publish(
      {
        id: 'unit-1',
        fragmentId: 'frag-1',
        brandId: 'brand-1',
        platform: Platform.tiktok,
        caption: 'Test video',
        mediaKey: 'key-1',
        mediaType: 'video',
        hashtags: ['test'],
        ncScore: 0.9,
        ncScoreBreakdown: {},
        approvalStatus: 'approved',
        similarityHash: 'hash',
        createdAt: new Date(),
      },
      mockConnection
    );

    expect(publishResult.platformPostId).toBeDefined();
    expect(publishResult.platformPostUrl).toContain('tiktok.com');
  });

  it('should throw error when getting unregistered platform adapter', () => {
    expect(() => getAdapter('unknown_platform' as any)).toThrowError(/No adapter registered/);
  });
});
