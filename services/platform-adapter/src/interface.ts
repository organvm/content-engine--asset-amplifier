import { ContentUnit, Platform, PlatformConnection } from '@cronus/domain';

export interface PlatformAdapter {
  platform: Platform;

  /**
   * Validates the connection/token for this platform.
   */
  authenticate(connection: PlatformConnection): Promise<boolean>;

  /**
   * Publishes a content unit to the platform.
   * Returns the platform-specific post ID or URL.
   */
  publish(unit: ContentUnit, connection: PlatformConnection): Promise<{
    platformPostId: string;
    platformPostUrl?: string;
  }>;

  /**
   * Fetches latest metrics for a specific post.
   */
  fetchMetrics(platformPostId: string, connection: PlatformConnection): Promise<PostMetrics>;

  /**
   * Returns technical specifications for media on this platform.
   */
  getFormatSpec(): MediaSpec;

  /**
   * Checks if the connection is currently rate-limited.
   */
  checkRateLimit(connection: PlatformConnection): Promise<boolean>;
}

export interface PostMetrics {
  views: number;
  engagement: number; // likes + comments + shares
  reach?: number;
  raw: Record<string, unknown>;
}

export interface MediaSpec {
  maxSizeMb: number;
  allowedExtensions: string[];
  aspectRatio: number;
  minWidth: number;
  minHeight: number;
}
