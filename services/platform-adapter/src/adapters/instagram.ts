import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:instagram');

export class InstagramAdapter implements PlatformAdapter {
  constructor(public platform: Platform) {}

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    log.info({ accountId: connection.platformAccountId }, 'Authenticating Instagram connection');
    // TODO: Verify token against Meta Graph API
    return true;
  }

  async publish(unit: ContentUnit, _connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to Instagram');
    
    // TODO: Implement Meta Graph API container creation and media publishing
    // Placeholder for async publishing flow
    return {
      platformPostId: `ig_${Math.random().toString(36).substring(7)}`,
      platformPostUrl: `https://instagram.com/p/placeholder`,
    };
  }

  async fetchMetrics(_platformPostId: string, _connection: PlatformConnection): Promise<PostMetrics> {
    // TODO: Fetch from Meta Insights API
    return {
      views: 100,
      engagement: 10,
      raw: {},
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

  async checkRateLimit(_connection: PlatformConnection): Promise<boolean> {
    return false;
  }
}
