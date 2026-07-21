import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

vi.mock('@cronus/content-generation', () => ({
  generateAssetContent: vi.fn().mockResolvedValue(true),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([{ id: 'asset-1', brand_id: 'brand-1' }]),
  orderBy: vi.fn().mockResolvedValue([{ id: 'cu-1' }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    mapRows: vi.fn((rows) => rows),
    schema: {
      assets: { id: 'assets.id', brand_id: 'assets.brand_id' },
      contentUnits: { id: 'content_units.id', brand_id: 'content_units.brand_id', approval_status: 'content_units.approval_status', platform: 'content_units.platform', created_at: 'content_units.created_at' },
    },
    eq: vi.fn(),
    and: vi.fn(),
    desc: vi.fn(),
  };
});

describe('Content Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/brands/:brandId/generate should start generation', async () => {
    mockDb.where = vi.fn().mockResolvedValue([{ id: 'asset-1' }]);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands/test-brand/generate',
      payload: { asset_id: 'asset-1' }
    });
    expect(response.statusCode).toBe(202);
    expect(JSON.parse(response.body)).toHaveProperty('job_id');
  });

  it('GET /api/v1/brands/:brandId/content should return list of content units', async () => {
    mockDb.where = vi.fn().mockReturnThis();
    mockDb.orderBy = vi.fn().mockResolvedValue([{ id: 'cu-1' }]);
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/content',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ id: 'cu-1' }]);
  });

  it('GET /api/v1/brands/:brandId/content/:contentUnitId should return a single content unit', async () => {
    mockDb.where = vi.fn().mockResolvedValue([{ id: 'cu-1' }]);
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/content/cu-1',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 'cu-1' });
  });

  it('POST /api/v1/brands/:brandId/content/:contentUnitId/approve should approve content unit', async () => {
    mockDb.where = vi.fn().mockResolvedValue([{ id: 'cu-1' }]); // For update
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands/test-brand/content/cu-1/approve',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'approved' });
  });

  it('POST /api/v1/brands/:brandId/content/:contentUnitId/reject should reject content unit', async () => {
    mockDb.where = vi.fn().mockResolvedValue([{ id: 'cu-1' }]); // For update
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands/test-brand/content/cu-1/reject',
      payload: { reason: 'Test' }
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'rejected' });
  });
});
