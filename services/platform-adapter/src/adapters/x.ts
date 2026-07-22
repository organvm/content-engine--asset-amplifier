import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';
import { checkRateLimit as checkRateLimitFn } from '../rate-limiter.js';

const log = createLogger('platform-adapter:x');

export class XAdapter implements PlatformAdapter {
  platform = Platform.x;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('X: No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating X connection');
    try {
      const res = await fetch('https://api.twitter.com/2/users/me', {
        headers: { 'Authorization': `Bearer ${connection.accessToken}` },
      });
      if (!res.ok) {
        log.error({ status: res.status }, 'X token verification failed');
        return false;
      }
      return true;
    } catch (err) {
      log.error({ err }, 'X token verification error');
      return false;
    }
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

    const requestBody = {
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
      throw new Error(`X (Twitter) publish failed: ${res.status} ${errorText}`);
    }

    const data: Record<string, unknown> = await res.json();
    const body = data.data as Record<string, unknown> | undefined;
    const postId = (body?.id as string) || `x_${Math.random().toString(36).substring(7)}`;

    return {
      platformPostId: postId,
      platformPostUrl: `https://x.com/user/status/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('X: No access token provided');
    }
    try {
      const res = await fetch(
        `https://api.twitter.com/2/tweets/${platformPostId}?tweet.fields=public_metrics`,
        { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
      );
      if (!res.ok) {
        log.error({ status: res.status }, 'X metrics fetch failed, returning defaults');
        return { views: 0, engagement: 0, raw: { source: 'fallback' } };
      }
      const data: Record<string, unknown> = await res.json();
      const tweetData = data.data as Record<string, unknown> | undefined;
      const metrics = tweetData?.public_metrics as Record<string, unknown> | undefined;
      const views = (metrics?.impression_count as number) ?? 0;
      const likes = (metrics?.like_count as number) ?? 0;
      const replies = (metrics?.reply_count as number) ?? 0;
      const retweets = (metrics?.retweet_count as number) ?? 0;
      return { views, engagement: likes + replies + retweets, raw: data };
    } catch (err) {
      log.error({ err }, 'X metrics fetch error');
      return { views: 0, engagement: 0, raw: { source: 'error' } };
    }
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
    return checkRateLimitFn(connection, { maxRequests: 300, windowMs: 900000 });
  }
}
