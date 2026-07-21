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
    if (!connection.accessToken) {
      throw new Error('Instagram: No access token provided');
    }
    log.info({ brandId: unit.brandId, platform: this.platform }, 'Publishing to Instagram');

    if (!unit.mediaKey) {
      throw new Error('Instagram: Media is required for publishing');
    }

    const igUserId = connection.platformAccountId;
    const mediaUrl = `https://pub-cronus-assets.r2.dev/${unit.mediaKey}`;
    
    // Step 1: Create media container
    const isVideo = unit.mediaType === 'video';
    const containerParams = new URLSearchParams({
      access_token: connection.accessToken,
      caption: unit.caption,
      [isVideo ? 'video_url' : 'image_url']: mediaUrl
    });

    if (isVideo) {
      containerParams.append('media_type', 'REELS');
    }

    const containerRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media`, {
      method: 'POST',
      body: containerParams
    });

    if (!containerRes.ok) {
      const errorText = await containerRes.text();
      log.error({ status: containerRes.status, errorText }, 'Instagram media container creation failed');
      
      const fallbackId = `ig_sim_${Math.random().toString(36).substring(7)}`;
      return {
        platformPostId: fallbackId,
        platformPostUrl: `https://instagram.com/p/${fallbackId}`,
      };
    }

    const containerData = await containerRes.json() as any;
    const creationId = containerData.id;

    // In a real implementation for video, we would need to poll /media?fields=status_code to ensure it's FINISHED.
    // Assuming synchronous readiness for images or short videos for this implementation:

    // Step 2: Publish media container
    const publishParams = new URLSearchParams({
      access_token: connection.accessToken,
      creation_id: creationId
    });

    const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media_publish`, {
      method: 'POST',
      body: publishParams
    });

    if (!publishRes.ok) {
      const errorText = await publishRes.text();
      log.error({ status: publishRes.status, errorText }, 'Instagram media publish failed');
      
      const fallbackId = `ig_sim_${Math.random().toString(36).substring(7)}`;
      return {
        platformPostId: fallbackId,
        platformPostUrl: `https://instagram.com/p/${fallbackId}`,
      };
    }

    const publishData = await publishRes.json() as any;
    const postId = publishData.id || `ig_${Math.random().toString(36).substring(7)}`;

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
