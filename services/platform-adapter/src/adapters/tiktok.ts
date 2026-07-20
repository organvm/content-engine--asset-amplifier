import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:tiktok');

export class TikTokAdapter implements PlatformAdapter {
  platform = Platform.tiktok;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    log.info({ accountId: connection.platformAccountId }, 'Authenticating TikTok connection');
    // TODO: Verify access token against TikTok API
    return true;
  }

  async publish(unit: ContentUnit, _connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to TikTok');

    // TODO: Implement TikTok Content Posting API
    // - Step 1: Initialize upload via POST /v2/post/publish/video/init/
    // - Step 2: Upload video file
    // - Step 3: Poll for processing status
    // - Step 4: Publish when ready
    // Constraints: 10 min max, 287.6 MB max, 1080x1920 recommended

    return {
      platformPostId: `tt_${Math.random().toString(36).substring(7)}`,
      platformPostUrl: `https://www.tiktok.com/@user/video/placeholder`,
    };
  }

  async fetchMetrics(_platformPostId: string, _connection: PlatformConnection): Promise<PostMetrics> {
    // TODO: Fetch from TikTok Data API
    // Fields: play_count, like_count, comment_count, share_count
    return {
      views: 0,
      engagement: 0,
      raw: {},
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

  async checkRateLimit(_connection: PlatformConnection): Promise<boolean> {
    // TODO: Check TikTok rate limits
    return false;
  }
}
