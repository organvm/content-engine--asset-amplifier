import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:instagram');

export class InstagramAdapter implements PlatformAdapter {
  constructor(public platform: Platform) {}

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    log.info({ accountId: connection.platformAccountId }, 'Authenticating Instagram connection');
    if (!connection.accessToken) {
      log.error('No access token provided');
      return false;
    }
    // TODO: Verify token against Meta Graph API: GET /me?access_token={token}
    // For now, accept any non-empty token
    return true;
  }

  async publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to Instagram');
    
    if (!connection.accessToken) {
      throw new Error('Instagram: No access token provided');
    }

    // TODO: Implement Meta Graph API container creation and media publishing
    // Step 1: Create media container
    // POST /{ig-user-id}/media
    //   ?image_url={media-url}&caption={caption}&access_token={token}
    // Step 2: Publish container
    // POST /{ig-user-id}/media_publish
    //   ?creation_id={creation-id}&access_token={token}
    
    // Placeholder for async publishing flow
    const postId = `ig_${Math.random().toString(36).substring(7)}`;
    log.info({ postId }, 'Instagram publish simulated');
    
    return {
      platformPostId: postId,
      platformPostUrl: `https://instagram.com/p/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('Instagram: No access token provided');
    }
    // TODO: Fetch from Meta Insights API
    // GET /{media-id}/insights?metric=impressions,reach,engagement&access_token={token}
    log.info({ platformPostId }, 'Fetching Instagram metrics (simulated)');
    return {
      views: 100,
      engagement: 10,
      raw: { source: 'simulated' },
    };
  }

  getFormatSpec(): MediaSpec {
    return {
      maxSizeMb: 100,
      allowedExtensions: ['.mp4', '.mov'],
      aspectRatio: 9 / 16,
      minWidth: 1080,
      minHeight: 1920,
    };
  }

  async checkRateLimit(connection: PlatformConnection): Promise<boolean> {
    // TODO: Check Meta Graph API rate limit headers
    // Instagram Graph API: 200 calls per hour per user token
    // Return true if rate limited, false if OK
    return false;
  }
}
