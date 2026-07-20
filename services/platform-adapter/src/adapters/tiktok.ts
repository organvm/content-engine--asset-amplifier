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

  async publish(unit: ContentUnit, _connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    if (!connection.accessToken) {
      throw new Error('TikTok: No access token provided');
    }
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to TikTok');

    // TODO: Implement TikTok Content Posting API
    // Step 1: Initialize upload via POST /v2/post/publish/video/init/
    //   { "post_info": {...}, "source_info": {...}, "post_mode": "DIRECT_POST" }
    // Step 2: Upload video file to publish_url
    // Step 3: Poll for processing status via GET /v2/post/publish/status/fetch/
    // Step 4: Publish when ready
    // Constraints: 10 min max, 287.6 MB max, 1080x1920 recommended

    const postId = `tt_${Math.random().toString(36).substring(7)}`;
    log.info({ postId }, 'TikTok publish simulated');

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
