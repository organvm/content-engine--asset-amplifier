import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

vi.mock('@cronus/natural-center', () => ({
  deriveNaturalCenter: vi.fn().mockResolvedValue(true),
  refineNaturalCenter: vi.fn().mockResolvedValue(true),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([{ id: 'nc-1', brand_id: 'brand-1', inquiries: [{ id: 'inq-1' }] }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    toCamel: vi.fn((obj) => obj),
    schema: {
      naturalCenters: { id: 'natural_centers.id', brand_id: 'natural_centers.brand_id' },
    },
    eq: vi.fn(),
  };
});

describe('Natural Center Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/brands/:brandId/natural-center should return natural center', async () => {
    mockDb.where = vi.fn().mockResolvedValue([{ id: 'nc-1' }]);
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/natural-center',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 'nc-1' });
  });

  it('POST /api/v1/brands/:brandId/natural-center should trigger derivation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands/test-brand/natural-center',
      payload: { asset_ids: ['asset-1'] }
    });
    expect(response.statusCode).toBe(202);
    expect(JSON.parse(response.body)).toHaveProperty('job_id');
  });

  it('PATCH /api/v1/brands/:brandId/natural-center should refine natural center', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/brands/test-brand/natural-center',
      payload: { adjustments: { tone: 'bolder' } }
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'refined' });
  });

  it('POST /api/v1/brands/:brandId/natural-center/inquiries/:inquiryId/answer should answer inquiry', async () => {
    mockDb.where = vi.fn().mockResolvedValue([{ id: 'nc-1', inquiries: [{ id: 'inq-1' }] }]);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands/test-brand/natural-center/inquiries/inq-1/answer',
      payload: { answer: 'Yes' }
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'answered' });
  });
});
