import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';
import { checkRateLimit as checkRateLimitFn } from '../rate-limiter.js';

const log = createLogger('platform-adapter:tiktok');

export class TikTokAdapter implements PlatformAdapter {
  platform = Platform.tiktok;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('TikTok: No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating TikTok connection');
    try {
      const res = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=open_id`,
        { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
      );
      if (!res.ok) {
        log.error({ status: res.status }, 'TikTok token verification failed');
        return false;
      }
      return true;
    } catch (err) {
      log.error({ err }, 'TikTok token verification error');
      return false;
    }
  }

  async publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    if (!connection.accessToken) {
      throw new Error('TikTok: No access token provided');
    }
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to TikTok');

    if (!unit.mediaKey) {
      throw new Error('TikTok: Video mediaKey is required for publishing');
    }

    const initRequestBody = {
      post_info: {
        title: unit.caption,
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: `https://pub-cronus-assets.r2.dev/${unit.mediaKey}` // Assuming public URL for demo
      },
      post_mode: 'DIRECT_POST'
    };

    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(initRequestBody)
    });

    if (!res.ok) {
      const errorText = await res.text();
      log.error({ status: res.status, errorText }, 'TikTok publish initialization failed');
      throw new Error(`TikTok publish failed: ${res.status} ${errorText}`);
    }

    const data: Record<string, unknown> = await res.json();
    const body = data.data as Record<string, unknown> | undefined;
    const postId = (body?.publish_id as string) || `tt_${Math.random().toString(36).substring(7)}`;

    return {
      platformPostId: postId,
      platformPostUrl: `https://www.tiktok.com/@user/video/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('TikTok: No access token provided');
    }
    try {
      const res = await fetch(
        'https://open.tiktokapis.com/v2/video/query/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters: { video_ids: [platformPostId] } }),
        }
      );
      if (!res.ok) {
        log.error({ status: res.status }, 'TikTok metrics fetch failed, returning defaults');
        return { views: 0, engagement: 0, raw: { source: 'fallback' } };
      }
      const data: Record<string, unknown> = await res.json();
      const d = data.data as Record<string, unknown> | undefined;
      const videoList = d?.video_list as Record<string, unknown> | undefined;
      const video = videoList?.[platformPostId] as Record<string, unknown> | undefined;
      const views = (video?.view_count as number) ?? 0;
      const likes = (video?.like_count as number) ?? 0;
      const comments = (video?.comment_count as number) ?? 0;
      const shares = (video?.share_count as number) ?? 0;
      return { views, engagement: likes + comments + shares, raw: data };
    } catch (err) {
      log.error({ err }, 'TikTok metrics fetch error');
      return { views: 0, engagement: 0, raw: { source: 'error' } };
    }
  }

  getFormatSpec(): MediaSpec {
    return {
      maxSizeMb: 287.6,
      allowedExtensions: ['.mp4', '.mov'],
      aspectRatio: 9 / 16,
      minWidth: 1080,
      minHeight: 1920,
    };
  }

  async checkRateLimit(connection: PlatformConnection): Promise<boolean> {
    return checkRateLimitFn(connection, { maxRequests: 100, windowMs: 60000 });
  }
}
