/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

function makeChainable(resolvedValue: any) {
  const promise = Promise.resolve(resolvedValue);
  (promise as any).where = vi.fn().mockResolvedValue(resolvedValue);
  (promise as any).orderBy = vi.fn().mockResolvedValue(resolvedValue);
  return promise;
}

const mockDb: any = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 'brand-1', name: 'Test Brand' }]),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockImplementation(() => makeChainable([{ id: 'brand-1', name: 'Test Brand' }])),
  where: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    mapRows: vi.fn((rows) => rows),
    toCamel: vi.fn((obj) => obj),
    schema: {
      brands: { id: 'brands.id', agency_id: 'brands.agency_id' }
    },
    eq: vi.fn(),
  };
});

describe('Brands Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/brands should create a brand', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands',
      payload: { name: 'Test Brand', description: 'Test' }
    });
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({ id: 'brand-1', name: 'Test Brand' });
  });

  it('GET /api/v1/brands should return brands', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ id: 'brand-1', name: 'Test Brand' }]);
  });

  it('GET /api/v1/brands/:brandId should return a brand', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/brand-1',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 'brand-1', name: 'Test Brand' });
  });

  it('PATCH /api/v1/brands/:brandId should update a brand', async () => {
    mockDb.returning = vi.fn().mockResolvedValue([{ id: 'brand-1', name: 'Updated Brand' }]);
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/brands/brand-1',
      payload: { name: 'Updated Brand' }
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 'brand-1', name: 'Updated Brand' });
  });
});
