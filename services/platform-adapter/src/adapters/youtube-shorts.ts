import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:youtube-shorts');

export class YouTubeShortsAdapter implements PlatformAdapter {
  platform = Platform.youtube_shorts;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('YouTube: No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating YouTube connection');
    // TODO: Verify OAuth2 token against YouTube Data API v3: GET /youtube/v3/channels?part=snippet&mine=true
    return true;
  }

  async publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    if (!connection.accessToken) {
      throw new Error('YouTube: No access token provided');
    }
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to YouTube Shorts');

    // TODO: Implement YouTube Shorts upload via YouTube Data API v3
    // POST /upload/youtube/v3/videos?uploadType=multipart
    //   { "snippet": { "title": "...", "description": "...", "tags": [...] }, "status": { "privacyStatus": "public" } }
    // Add #Shorts to title/description for Shorts discovery
    // Constraints: 60 sec max for Shorts, 256 GB max file size
    // Vertical format preferred (9:16)

    const postId = `yt_${Math.random().toString(36).substring(7)}`;
    log.info({ postId }, 'YouTube Shorts publish simulated');

    return {
      platformPostId: postId,
      platformPostUrl: `https://youtube.com/shorts/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('YouTube: No access token provided');
    }
    // TODO: Fetch from YouTube Analytics API
    // GET /youtube/analytics/v2/reports?ids=channel==MINE&metrics=views,likes,comments
    log.info({ platformPostId }, 'Fetching YouTube metrics (simulated)');
    return {
      views: 0,
      engagement: 0,
      raw: { source: 'simulated' },
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

  async checkRateLimit(connection: PlatformConnection): Promise<boolean> {
    // YouTube API: 10,000 units per day (varies by operation)
    return false;
  }
}
