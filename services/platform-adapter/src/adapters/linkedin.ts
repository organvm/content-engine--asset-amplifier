import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';
import { PlatformAdapter, PostMetrics, MediaSpec } from '../interface.js';
import { createLogger } from '@cronus/logger';
import { checkRateLimit as checkRateLimitFn } from '../rate-limiter.js';

const log = createLogger('platform-adapter:linkedin');

export class LinkedInAdapter implements PlatformAdapter {
  platform = Platform.linkedin;

  async authenticate(connection: PlatformConnection): Promise<boolean> {
    if (!connection.accessToken) {
      log.error('LinkedIn: No access token provided');
      return false;
    }
    log.info({ accountId: connection.platformAccountId }, 'Authenticating LinkedIn connection');
    try {
      const res = await fetch('https://api.linkedin.com/v2/me', {
        headers: { 'Authorization': `Bearer ${connection.accessToken}` },
      });
      if (!res.ok) {
        log.error({ status: res.status }, 'LinkedIn token verification failed');
        return false;
      }
      return true;
    } catch (err) {
      log.error({ err }, 'LinkedIn token verification error');
      return false;
    }
  }

  async publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }> {
    if (!connection.accessToken) {
      throw new Error('LinkedIn: No access token provided');
    }
    log.info({ brandId: unit.brandId }, 'Publishing to LinkedIn');
    
    // Convert owner URN from platformAccountId
    const authorUrn = `urn:li:person:${connection.platformAccountId}`;

    // Prepare share request body (UGC Post API format)
    const requestBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: unit.caption
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // If there is a media object, attach it
    // In a real implementation, we would register an upload and upload the binary first.
    // We will assume text-only for now unless unit.mediaKey is processed.

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorText = await res.text();
      log.error({ status: res.status, errorText }, 'LinkedIn publish failed');
      throw new Error(`LinkedIn publish failed: ${res.status} ${errorText}`);
    }

    const data: Record<string, unknown> = await res.json();
    const postId = (data.id as string) || `li_${Math.random().toString(36).substring(7)}`;

    return {
      platformPostId: postId,
      platformPostUrl: `https://linkedin.com/posts/${postId}`,
    };
  }

  async fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics> {
    if (!connection.accessToken) {
      throw new Error('LinkedIn: No access token provided');
    }
    try {
      const res = await fetch(
        `https://api.linkedin.com/v2/shares/${platformPostId}`,
        { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
      );
      if (!res.ok) {
        log.error({ status: res.status }, 'LinkedIn metrics fetch failed, returning defaults');
        return { views: 0, engagement: 0, raw: { source: 'fallback' } };
      }
      const data: Record<string, unknown> = await res.json();
      const summary = data.summary as Record<string, unknown> | undefined;
      const views = (summary?.impressionCount as number) ?? 0;
      const likes = (summary?.likeCount as number) ?? 0;
      const comments = (summary?.commentCount as number) ?? 0;
      const shares = (summary?.shareCount as number) ?? 0;
      return { views, engagement: likes + comments + shares, raw: data };
    } catch (err) {
      log.error({ err }, 'LinkedIn metrics fetch error');
      return { views: 0, engagement: 0, raw: { source: 'error' } };
    }
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
    return checkRateLimitFn(connection, { maxRequests: 100, windowMs: 86400000 });
  }
}
