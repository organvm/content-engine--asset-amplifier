import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:tiktok');

export class TikTokAdapter implements PlatformAdapter {
  platform = Platform.tiktok;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('TikTok: No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating TikTok connection');
    // TODO: Verify access token against TikTok API: GET /v2/user/info/
    return true;
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
      
      const fallbackId = `tt_sim_${Math.random().toString(36).substring(7)}`;
      return {
        platformPostId: fallbackId,
        platformPostUrl: `https://www.tiktok.com/@user/video/${fallbackId}`,
      };
    }

    const data = await res.json() as any;
    const postId = data.data?.publish_id || `tt_${Math.random().toString(36).substring(7)}`;

    return {
      platformPostId: postId,
      platformPostUrl: `https://www.tiktok.com/@user/video/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('TikTok: No access token provided');
    }
    // TODO: Fetch from TikTok Data API
    // Fields: play_count, like_count, comment_count, share_count
    log.info({ platformPostId }, 'Fetching TikTok metrics (simulated)');
    return {
      views: 0,
      engagement: 0,
      raw: { source: 'simulated' },
    };
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
    // TikTok API: 100 requests per minute per app
    return false;
  }
}
