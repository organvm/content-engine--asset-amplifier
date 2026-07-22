import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([{ id: 'conn-1', platform: 'linkedin' }]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    mapRows: vi.fn((rows) => rows),
    schema: {
      platformConnections: { brand_id: 'brand_id', platform: 'platform', platform_account_id: 'platform_account_id' },
    },
    eq: vi.fn(),
  };
});

vi.mock('@cronus/config', () => ({
  getConfig: vi.fn().mockReturnValue({
    LINKEDIN_CLIENT_ID: 'linkedin-client',
    LINKEDIN_CLIENT_SECRET: 'linkedin-secret',
    INSTAGRAM_CLIENT_ID: 'instagram-client',
    INSTAGRAM_CLIENT_SECRET: 'instagram-secret',
  }),
  encrypt: vi.fn((val) => `encrypted_${val}`),
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { access_token: 'mock-token' } }),
  }
}));

describe('Platforms Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/brands/:brandId/platforms should return connections', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/platforms',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ id: 'conn-1', platform: 'linkedin' }]);
  });

  it('GET /api/v1/brands/:brandId/platforms/connect/linkedin should redirect', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/platforms/connect/linkedin',
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('linkedin.com');
  });

  it('GET /api/v1/platforms/callback/linkedin should handle callback', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/platforms/callback/linkedin?code=123&state=test-brand',
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('status=success');
  });

  it('GET /api/v1/brands/:brandId/platforms/connect/instagram should redirect', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/platforms/connect/instagram',
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('facebook.com');
  });

  it('GET /api/v1/platforms/callback/instagram should handle callback', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/platforms/callback/instagram?code=123&state=test-brand',
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('status=success');
  });
});
