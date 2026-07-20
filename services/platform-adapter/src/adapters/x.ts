import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:x');

export class XAdapter implements PlatformAdapter {
  platform = Platform.x;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('X: No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating X connection');
    // TODO: Verify bearer token against X API v2: GET /2/users/me
    return true;
  }

  async publish(unit: ContentUnit, _connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    if (!connection.accessToken) {
      throw new Error('X: No access token provided');
    }
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to X');

    // TODO: Implement X API v2 tweet creation
    // For image: POST /2/tweets with media_ids
    // For video: POST /1.1/media/upload.json (chunked) then POST /2/tweets
    // Respect 280-char limit for text (or 4000 for Blue subscribers)

    const postId = `x_${Math.random().toString(36).substring(7)}`;
    log.info({ postId }, 'X publish simulated');

    return {
      platformPostId: postId,
      platformPostUrl: `https://x.com/i/status/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('X: No access token provided');
    }
    // TODO: Fetch from X API v2 tweet metrics
    // GET /2/tweets/:id?tweet.fields=public_metrics
    // Fields: impression_count, like_count, reply_count, retweet_count
    log.info({ platformPostId }, 'Fetching X metrics (simulated)');
    return {
      views: 0,
      engagement: 0,
      raw: { source: 'simulated' },
    };
  }

  getFormatSpec(): MediaSpec {
    return {
      maxSizeMb: 512,
      allowedExtensions: ['.mp4', '.mov', '.png', '.jpg', '.gif'],
      aspectRatio: 16 / 9,
      minWidth: 1280,
      minHeight: 720,
    };
  }

  async checkRateLimit(connection: PlatformConnection): Promise<boolean> {
    // X API v2: 300 requests per 15 minutes (user context)
    return false;
  }
}
