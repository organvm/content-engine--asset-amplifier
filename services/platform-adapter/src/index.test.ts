import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { getAdapter } from './index.js';
import { TikTokAdapter } from './adapters/tiktok.js';
import { InstagramAdapter } from './adapters/instagram.js';
import { XAdapter } from './adapters/x.js';
import { LinkedInAdapter } from './adapters/linkedin.js';
import { YouTubeShortsAdapter } from './adapters/youtube-shorts.js';
import { Platform, PlatformConnectionStatus, PlatformConnection } from '@cronus/domain';
import type { ContentUnit } from '@cronus/domain';

function mockConnection(overrides?: Partial<PlatformConnection>): PlatformConnection {
  return {
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
    ...overrides,
  };
}

function mockContentUnit(overrides?: Partial<ContentUnit>): ContentUnit {
  return {
    id: 'unit-1',
    fragmentId: 'frag-1',
    brandId: 'brand-1',
    platform: Platform.tiktok,
    caption: 'Test caption',
    mediaKey: 'key-1',
    mediaType: 'video',
    hashtags: ['test'],
    ncScore: 0.9,
    ncScoreBreakdown: {},
    approvalStatus: 'approved',
    similarityHash: 'hash',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('@cronus/platform-adapter registry and adapters', () => {
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url: string | URL | Request) => {
      return new Response(JSON.stringify({ id: 'mock-post-id', data: { publish_id: 'mock-publish' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('should retrieve registered adapter for X/Twitter', () => {
    const adapter = getAdapter(Platform.x);
    expect(adapter.platform).toBe(Platform.x);
    expect(adapter.getFormatSpec().maxSizeMb).toBe(512);
  });

  it('should retrieve registered adapter for YouTube Shorts', () => {
    const adapter = getAdapter(Platform.youtube_shorts);
    expect(adapter.platform).toBe(Platform.youtube_shorts);
    expect(adapter.getFormatSpec().allowedExtensions).toContain('.webm');
  });

  it('should authenticate and publish on TikTok adapter', async () => {
    const adapter = getAdapter(Platform.tiktok) as TikTokAdapter;
    const conn = mockConnection();

    vi.spyOn(TikTokAdapter.prototype, 'publish').mockResolvedValue({
      platformPostId: 'tt_mock-123',
      platformPostUrl: 'https://www.tiktok.com/@user/video/tt_mock-123',
    });

    const isAuthed = await adapter.authenticate(conn);
    expect(isAuthed).toBe(true);

    const result = await adapter.publish(mockContentUnit({ platform: Platform.tiktok }), conn);
    expect(result.platformPostId).toBe('tt_mock-123');
    expect(result.platformPostUrl).toContain('tiktok.com');
  });

  it('should authenticate and publish on Instagram adapter', async () => {
    const adapter = getAdapter(Platform.instagram_feed) as InstagramAdapter;
    const conn = mockConnection({ platform: Platform.instagram_feed });

    vi.spyOn(InstagramAdapter.prototype, 'publish').mockResolvedValue({
      platformPostId: 'ig_mock-456',
      platformPostUrl: 'https://instagram.com/p/ig_mock-456',
    });

    const isAuthed = await adapter.authenticate(conn);
    expect(isAuthed).toBe(true);

    const result = await adapter.publish(
      mockContentUnit({ platform: Platform.instagram_feed, mediaKey: 'img-key', mediaType: 'image' }),
      conn
    );
    expect(result.platformPostId).toBe('ig_mock-456');
    expect(result.platformPostUrl).toContain('instagram.com');
  });

  it('should authenticate and publish on X adapter', async () => {
    const adapter = getAdapter(Platform.x) as XAdapter;
    const conn = mockConnection({ platform: Platform.x });

    vi.spyOn(XAdapter.prototype, 'publish').mockResolvedValue({
      platformPostId: 'x_mock-789',
      platformPostUrl: 'https://x.com/user/status/x_mock-789',
    });

    const isAuthed = await adapter.authenticate(conn);
    expect(isAuthed).toBe(true);

    const result = await adapter.publish(
      mockContentUnit({ platform: Platform.x }),
      conn
    );
    expect(result.platformPostId).toBe('x_mock-789');
    expect(result.platformPostUrl).toContain('x.com');
  });

  it('should authenticate and publish on LinkedIn adapter', async () => {
    const adapter = getAdapter(Platform.linkedin) as LinkedInAdapter;
    const conn = mockConnection({ platform: Platform.linkedin });

    vi.spyOn(LinkedInAdapter.prototype, 'publish').mockResolvedValue({
      platformPostId: 'li_mock-101',
      platformPostUrl: 'https://linkedin.com/posts/li_mock-101',
    });

    const isAuthed = await adapter.authenticate(conn);
    expect(isAuthed).toBe(true);

    const result = await adapter.publish(
      mockContentUnit({ platform: Platform.linkedin }),
      conn
    );
    expect(result.platformPostId).toBe('li_mock-101');
    expect(result.platformPostUrl).toContain('linkedin.com');
  });

  it('should authenticate and publish on YouTube Shorts adapter', async () => {
    const adapter = getAdapter(Platform.youtube_shorts) as YouTubeShortsAdapter;
    const conn = mockConnection({ platform: Platform.youtube_shorts });

    vi.spyOn(YouTubeShortsAdapter.prototype, 'publish').mockResolvedValue({
      platformPostId: 'yt_mock-112',
      platformPostUrl: 'https://youtube.com/shorts/yt_mock-112',
    });

    const isAuthed = await adapter.authenticate(conn);
    expect(isAuthed).toBe(true);

    const result = await adapter.publish(
      mockContentUnit({ platform: Platform.youtube_shorts }),
      conn
    );
    expect(result.platformPostId).toBe('yt_mock-112');
    expect(result.platformPostUrl).toContain('youtube.com/shorts');
  });

  it('should deny auth when no access token', async () => {
    const adapter = getAdapter(Platform.tiktok);
    const isAuthed = await adapter.authenticate(mockConnection({ accessToken: undefined }));
    expect(isAuthed).toBe(false);
  });

  it('should return simulated metrics from fetchMetrics on TikTok', async () => {
    const adapter = getAdapter(Platform.tiktok);
    const metrics = await adapter.fetchMetrics('vid-1', mockConnection());
    expect(metrics).toHaveProperty('views');
    expect(metrics).toHaveProperty('engagement');
  });

  it('should throw error when getting unregistered platform adapter', () => {
    expect(() => getAdapter('unknown_platform' as unknown as import('@cronus/domain').Platform)).toThrowError(/No adapter registered/);
  });
});
