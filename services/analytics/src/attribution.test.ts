import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeAssetAttribution } from './attribution.js';
import { getDb } from '@cronus/db';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: {
    publishEvents: { id: 'publishEvents' },
    contentUnits: { id: 'contentUnits', fragment_id: 'fragment_id' },
    fragments: { id: 'fragments', asset_id: 'asset_id' },
    performanceObservations: { id: 'performanceObservations', publish_event_id: 'publish_event_id', views: 'views', likes: 'likes', comments: 'comments', shares: 'shares', saves: 'saves' }
  },
  eq: vi.fn(),
  sql: vi.fn((strings, ...values) => ({ strings, values })),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('computeAssetAttribution', () => {
  let dbMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    dbMock = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
    };
    (getDb as any).mockReturnValue(dbMock);
  });

  it('should correctly compute asset attribution from fragment metrics', async () => {
    const mockFragmentMetrics = [
      { fragment_id: 'frag-1', total_views: '100', total_engagement: '10' },
      { fragment_id: 'frag-2', total_views: '200', total_engagement: '30' }
    ];

    dbMock.groupBy.mockResolvedValueOnce(mockFragmentMetrics);

    const result = await computeAssetAttribution('asset-1');

    expect(result.assetId).toBe('asset-1');
    expect(result.totalViews).toBe(300);
    expect(result.totalEngagement).toBe(40);
    expect(result.engagementRate).toBe(40 / 300);
    expect(result.fragments).toEqual(mockFragmentMetrics);
  });

  it('should handle zero views safely', async () => {
    const mockFragmentMetrics = [
      { fragment_id: 'frag-1', total_views: '0', total_engagement: '0' }
    ];

    dbMock.groupBy.mockResolvedValueOnce(mockFragmentMetrics);

    const result = await computeAssetAttribution('asset-1');

    expect(result.assetId).toBe('asset-1');
    expect(result.totalViews).toBe(0);
    expect(result.totalEngagement).toBe(0);
    expect(result.engagementRate).toBe(0);
  });
});
