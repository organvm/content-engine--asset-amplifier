import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:x');

export class XAdapter implements PlatformAdapter {
  platform = Platform.x;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    log.info({ accountId: connection.platformAccountId }, 'Authenticating X connection');
    // TODO: Verify bearer token against X API v2
    return true;
  }

  async publish(unit: ContentUnit, _connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to X');

    // TODO: Implement X API v2 tweet creation
    // - For image: POST /2/tweets with media upload
    // - For video: POST /1.1/media/upload.json then POST /2/tweets
    // - Respect 280-char limit for text (or 4000 for Blue subscribers)

    return {
      platformPostId: `x_${Math.random().toString(36).substring(7)}`,
      platformPostUrl: `https://x.com/i/status/placeholder`,
    };
  }

  async fetchMetrics(_platformPostId: string, _connection: PlatformConnection): Promise<PostMetrics> {
    // TODO: Fetch from X API v2 tweet metrics
    // Fields: organic_metrics.impression_count, organic_metrics.like_count, etc.
    return {
      views: 0,
      engagement: 0,
      raw: {},
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

  async checkRateLimit(_connection: PlatformConnection): Promise<boolean> {
    // TODO: Check X API rate limit headers
    return false;
  }
}
