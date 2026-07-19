import { Platform } from '@cronus/domain';

/**
 * Normalizes metrics from different platforms to a common 0-1 score.
 * Formula accounts for platform engagement baselines.
 */
export function normalizeMetrics(params: {
  platform: Platform;
  views: number;
  engagement: number;
  followers?: number;
}): number {
  const { platform, views, engagement } = params;

  if (views === 0) return 0;

  // Engagement Rate (ER) = Engagement / Views
  const er = engagement / views;

  // Platform-specific multipliers (inverse of average platform ER)
  // These are heuristics for MVP
  const multipliers: Record<Platform, number> = {
    [Platform.instagram_feed]: 1.0,
    [Platform.instagram_story]: 2.0,
    [Platform.instagram_reels]: 0.5,
    [Platform.linkedin]: 1.5,
    [Platform.tiktok]: 0.3,
    [Platform.youtube_shorts]: 0.4,
    [Platform.x]: 1.2,
  };

  const multiplier = multipliers[platform] || 1.0;
  
  // Normalized score = ER * Multiplier * (Log of reach factor if available)
  const score = er * multiplier;

  // Clamp to 0-1 (though ER can technically be > 1, it's rare)
  return Math.min(Math.max(score, 0), 1);
}
