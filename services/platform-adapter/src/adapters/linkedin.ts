import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:linkedin');

export class LinkedInAdapter implements PlatformAdapter {
  platform = Platform.linkedin;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('LinkedIn: No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating LinkedIn connection');
    // TODO: Verify token against LinkedIn API: GET /v2/me
    return true;
  }

  async publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    if (!connection.accessToken) {
      throw new Error('LinkedIn: No access token provided');
    }
    log.info({ brandId: unit.brandId }, 'Publishing to LinkedIn');
    
    // TODO: Implement LinkedIn Share API
    // POST /v2/shares
    //   { "owner": "urn:li:person:{person-id}", "content": {...}, "distribution": {...} }
    
    const postId = `li_${Math.random().toString(36).substring(7)}`;
    log.info({ postId }, 'LinkedIn publish simulated');
    
    return {
      platformPostId: postId,
      platformPostUrl: `https://linkedin.com/posts/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('LinkedIn: No access token provided');
    }
    // TODO: Fetch from LinkedIn Analytics API
    log.info({ platformPostId }, 'Fetching LinkedIn metrics (simulated)');
    return {
      views: 50,
      engagement: 5,
      raw: { source: 'simulated' },
    };
  }

  getFormatSpec(): MediaSpec {
    return {
      maxSizeMb: 200,
      allowedExtensions: ['.mp4', '.png', '.jpg'],
      aspectRatio: 1.91,
      minWidth: 1200,
      minHeight: 627,
    };
  }

  async checkRateLimit(connection: PlatformConnection): Promise<boolean> {
    // LinkedIn API: 100 requests per member per day (varies by endpoint)
    return false;
  }
}
