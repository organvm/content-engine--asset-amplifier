import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

vi.mock('@cronus/analytics', () => ({
  generateWeeklyReport: vi.fn().mockResolvedValue({ status: 'ok', report: true }),
  computeAssetAttribution: vi.fn().mockResolvedValue({ attribution: 100 }),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([{ asset_id: 'asset-1' }]),
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    mapRows: vi.fn((rows) => rows),
    schema: {
      assets: { id: 'assets.id', brand_id: 'assets.brand_id', original_filename: 'assets.original_filename', media_type: 'assets.media_type', created_at: 'assets.created_at' },
      fragments: { id: 'fragments.id', asset_id: 'fragments.asset_id' },
      contentUnits: { id: 'content_units.id', fragment_id: 'content_units.fragment_id', approval_status: 'content_units.approval_status', platform: 'content_units.platform' },
      publishEvents: { id: 'publish_events.id', content_unit_id: 'publish_events.content_unit_id' },
      performanceObservations: { publish_event_id: 'performance_observations.publish_event_id', views: 'performance_observations.views', likes: 'performance_observations.likes', comments: 'performance_observations.comments', shares: 'performance_observations.shares', saves: 'performance_observations.saves' }
    },
    eq: vi.fn(),
    sql: vi.fn(),
    desc: vi.fn(),
  };
});

describe('Analytics Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/brands/:brandId/reports/weekly should return weekly report', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/reports/weekly',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'ok', report: true });
  });

  it('GET /api/v1/brands/:brandId/assets/:assetId/attribution should return attribution', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/assets/test-asset/attribution',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ attribution: 100 });
  });

  it('GET /api/v1/brands/:brandId/roi should return roi metrics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/roi',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ asset_id: 'asset-1' }]);
  });
});
