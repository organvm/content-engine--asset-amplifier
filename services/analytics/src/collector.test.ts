import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectMetrics } from './collector.js';
import { getDb } from '@cronus/db';
import { getAdapter } from '@cronus/platform-adapter';
import { PublishStatus, Platform } from '@cronus/domain';

// Mock dependencies
vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: {
    publishEvents: { id: 'publishEvents', status: 'status', content_unit_id: 'content_unit_id', platform_connection_id: 'platform_connection_id' },
    contentUnits: { id: 'contentUnits', brand_id: 'brand_id' },
    platformConnections: { id: 'platformConnections' },
    performanceObservations: { id: 'performanceObservations' }
  },
  eq: vi.fn(),
  and: vi.fn(),
}));

vi.mock('@cronus/platform-adapter', () => ({
  getAdapter: vi.fn(),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('node:crypto', () => ({
  randomUUID: () => 'mock-uuid',
}));

describe('collectMetrics', () => {
  let dbMock: any;
  let adapterMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    dbMock = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue({}),
    };

    (getDb as any).mockReturnValue(dbMock);

    adapterMock = {
      fetchMetrics: vi.fn().mockResolvedValue({
        views: 100,
        reach: 50,
        raw: { likes: 10, comments: 2, shares: 1, saves: 5, clicks: 20 }
      }),
    };

    (getAdapter as any).mockReturnValue(adapterMock);
  });

  it('should do nothing if no published events are found', async () => {
    dbMock.where.mockResolvedValueOnce([]); // no events
    await collectMetrics('brand-1');
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it('should collect and record metrics for published events', async () => {
    const mockEvents = [
      {
        publishEvent: {
          id: 'event-1',
          platform_post_id: 'post-1',
          platform_connection_id: 'conn-1',
        }
      }
    ];

    const mockConnections = [
      { id: 'conn-1', platform: Platform.instagram_feed }
    ];

    // First where returns events, second returns connection
    dbMock.where
      .mockResolvedValueOnce(mockEvents)
      .mockResolvedValueOnce(mockConnections);

    await collectMetrics('brand-1');

    expect(getAdapter).toHaveBeenCalledWith(Platform.instagram_feed);
    expect(adapterMock.fetchMetrics).toHaveBeenCalledWith('post-1', mockConnections[0]);
    expect(dbMock.insert).toHaveBeenCalled();
    expect(dbMock.values).toHaveBeenCalledWith(expect.objectContaining({
      id: 'mock-uuid',
      publish_event_id: 'event-1',
      views: 100,
      likes: 10
    }));
  });
});
