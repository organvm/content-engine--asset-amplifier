import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';

const log = createLogger('platform-adapter:linkedin');

export class LinkedInAdapter implements PlatformAdapter {
  platform = Platform.linkedin;

  async authenticate(_connection: PlatformConnection): Promise<boolean> {
    return true;
  }

  async publish(unit: ContentUnit, _connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    log.info({ brandId: unit.brandId }, 'Publishing to LinkedIn');
    return {
      platformPostId: `li_${Math.random().toString(36).substring(7)}`,
      platformPostUrl: `https://linkedin.com/posts/placeholder`,
    };
  }

  async fetchMetrics(_platformPostId: string, _connection: PlatformConnection): Promise<PostMetrics> {
    return {
      views: 50,
      engagement: 5,
      raw: {},
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

  async checkRateLimit(_connection: PlatformConnection): Promise<boolean> {
    return false;
  }
}
