import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';
vi.mock('@cronus/asset-ingestion', () => ({
  ingestAsset: vi.fn().mockResolvedValue({ id: 'new-asset-id', status: 'processing' }),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn((condition) => {
    if (typeof condition === 'object' && condition.brand_id) {
       // mock behavior based on brand id if necessary
    }
    return Promise.resolve([{ id: 'test-brand-id' }]); // mock resolve
  }),
  orderBy: vi.fn().mockResolvedValue([{ id: 'asset-1' }, { id: 'asset-2' }]),
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    schema: {
      brands: { id: 'brands.id' },
      assets: { id: 'assets.id', brand_id: 'assets.brand_id', created_at: 'assets.created_at' },
    },
    eq: vi.fn().mockReturnValue({}),
    and: vi.fn().mockReturnValue({}),
    desc: vi.fn().mockReturnValue({}),
  };
});

describe('Assets Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/brands/:brandId/assets should return list of assets', async () => {
    // Override where to return a chain that can be awaited
    mockDb.where = vi.fn().mockReturnThis();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/assets',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ id: 'asset-1' }, { id: 'asset-2' }]);
  });

  it('GET /api/v1/brands/:brandId/assets/:assetId should return asset details', async () => {
    mockDb.where = vi.fn().mockResolvedValue([{ id: 'asset-123' }]);
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/assets/asset-123',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 'asset-123' });
  });

  it('GET /api/v1/brands/:brandId/assets/:assetId should return 404 if not found', async () => {
    mockDb.where = vi.fn().mockResolvedValue([]);
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/assets/not-found',
    });
    expect(response.statusCode).toBe(404);
  });
});
