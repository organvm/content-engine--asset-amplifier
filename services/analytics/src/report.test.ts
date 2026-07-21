import { describe, it, expect } from 'vitest';
import { computeWeeklyReportSummary } from './report.js';

describe('@cronus/analytics report calculation', () => {
  it('should calculate zero engagement rate when total views is zero', () => {
    const summary = computeWeeklyReportSummary({
      brandId: 'brand-1',
      weekStart: new Date('2026-07-01'),
      weekEnd: new Date('2026-07-07'),
      postsPublished: 0,
      totalViews: 0,
      totalEngagement: 0,
      assetAttributions: [],
    });

    expect(summary.engagementRate).toBe(0);
    expect(summary.totalPostsPublished).toBe(0);
  });

  it('should calculate accurate engagement rate when views exist', () => {
    const summary = computeWeeklyReportSummary({
      brandId: 'brand-1',
      weekStart: new Date('2026-07-01'),
      weekEnd: new Date('2026-07-07'),
      postsPublished: 5,
      totalViews: 1000,
      totalEngagement: 150,
      assetAttributions: [
        { assetId: 'asset-1', originalFilename: 'hero.mp4', totalViews: 1000, totalEngagement: 150 },
      ],
    });

    expect(summary.engagementRate).toBe(0.15); // 15%
    expect(summary.assetAttributions).toHaveLength(1);
    expect(summary.assetAttributions[0].originalFilename).toBe('hero.mp4');
  });
});
