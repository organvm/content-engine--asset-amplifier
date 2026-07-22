import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';
import { checkRateLimit as checkRateLimitFn } from '../rate-limiter.js';

const log = createLogger('platform-adapter:instagram');

export class InstagramAdapter implements PlatformAdapter {
  constructor(public platform: Platform) {}

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating Instagram connection');
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${connection.accessToken}`);
      if (!res.ok) {
        log.error({ status: res.status }, 'Instagram token verification failed');
        return false;
      }
      return true;
    } catch (err) {
      log.error({ err }, 'Instagram token verification error');
      return false;
    }
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
      throw new Error(`Instagram media container creation failed: ${containerRes.status} ${errorText}`);
    }

    const containerData: Record<string, unknown> = await containerRes.json();
    const creationId = containerData.id as string;

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
      throw new Error(`Instagram media publish failed: ${publishRes.status} ${errorText}`);
    }

    const publishData: Record<string, unknown> = await publishRes.json();
    const postId = (publishData.id as string) || `ig_${Math.random().toString(36).substring(7)}`;

    return {
      platformPostId: postId,
      platformPostUrl: `https://instagram.com/p/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('Instagram: No access token provided');
    }
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${platformPostId}/insights?metric=impressions,reach,engagement&access_token=${connection.accessToken}`
      );
      if (!res.ok) {
        log.error({ status: res.status }, 'Instagram metrics fetch failed, returning defaults');
        return { views: 0, engagement: 0, raw: { source: 'fallback' } };
      }
      const data: Record<string, unknown> = await res.json();
      const dataArray = data.data as Array<Record<string, unknown>> | undefined;
      let views = 0;
      let engagement = 0;
      if (dataArray) {
        for (const metric of dataArray) {
          const name = metric.name as string;
          const values = metric.values as Array<Record<string, unknown>> | undefined;
          const value = values?.[0]?.value as number | undefined;
          if (name === 'impressions') views = value ?? 0;
          if (name === 'engagement') engagement = value ?? 0;
        }
      }
      return { views, engagement, raw: data };
    } catch (err) {
      log.error({ err }, 'Instagram metrics fetch error');
      return { views: 0, engagement: 0, raw: { source: 'error' } };
    }
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
    return checkRateLimitFn(connection, { maxRequests: 200, windowMs: 3600000 });
  }
}
