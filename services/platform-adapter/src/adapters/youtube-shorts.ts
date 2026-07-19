import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:youtube-shorts');

export class YouTubeShortsAdapter implements PlatformAdapter {
  platform = Platform.youtube_shorts;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    log.info({ accountId: connection.platformAccountId }, 'Authenticating YouTube connection');
    // TODO: Verify OAuth2 token against YouTube Data API v3
    return true;
  }

  async publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to YouTube Shorts');

    // TODO: Implement YouTube Shorts upload via YouTube Data API v3
    // - POST /upload/youtube/v3/videos?uploadType=multipart
    // - Set privacyStatus to "public" or "unlisted"
    // - Add #Shorts to title/description for Shorts discovery
    // - Constraints: 60 sec max for Shorts, 256 GB max file size
    // - Vertical format preferred (9:16)

    return {
      platformPostId: `yt_${Math.random().toString(36).substring(7)}`,
      platformPostUrl: `https://youtube.com/shorts/placeholder`,
    };
  }

  async fetchMetrics(_platformPostId: string, _connection: PlatformConnection): Promise<PostMetrics> {
    // TODO: Fetch from YouTube Analytics API
    // Fields: viewCount, likeCount, commentCount
    return {
      views: 0,
      engagement: 0,
      raw: {},
    };
  }

  getFormatSpec(): MediaSpec {
    return {
      maxSizeMb: 256 * 1024,
      allowedExtensions: ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.3gpp', '.webm'],
      aspectRatio: 9 / 16,
      minWidth: 1080,
      minHeight: 1920,
    };
  }

  async checkRateLimit(_connection: PlatformConnection): Promise<boolean> {
    // TODO: Check YouTube API quota
    return false;
  }
}
