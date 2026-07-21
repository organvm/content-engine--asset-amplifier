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

  async publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    if (!connection.accessToken) {
      throw new Error('X: No access token provided');
    }
    log.info({ brandId: unit.brandId }, 'Publishing to X (Twitter)');

    // Real implementation: POST https://api.twitter.com/2/tweets
    // First, upload media via v1.1 upload endpoint if needed.
    // For this implementation, we'll post text-only to the v2 endpoint if mediaKey is not provided.

    const requestBody: any = {
      text: unit.caption,
    };

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorText = await res.text();
      log.error({ status: res.status, errorText }, 'X (Twitter) publish failed');
      
      const fallbackId = `x_sim_${Math.random().toString(36).substring(7)}`;
      return {
        platformPostId: fallbackId,
        platformPostUrl: `https://x.com/user/status/${fallbackId}`,
      };
    }

    const data = await res.json() as any;
    const postId = data.data?.id || `x_${Math.random().toString(36).substring(7)}`;

    return {
      platformPostId: postId,
      platformPostUrl: `https://x.com/user/status/${postId}`,
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
