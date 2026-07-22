import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from './server.js';
import type { FastifyInstance } from 'fastify';

vi.mock('@cronus/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/config')>();
  return {
    ...actual,
    getConfig: vi.fn().mockReturnValue({
      INSTAGRAM_CLIENT_ID: 'mock',
      INSTAGRAM_CLIENT_SECRET: 'mock',
    }),
  };
});

describe('Fastify API Server Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return 200 OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /api/v1/settings/providers should return active providers shape', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/settings/providers',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('llm');
    expect(body).toHaveProperty('embedding');
    expect(body).toHaveProperty('transcription');
  });

  it('GET /api/v1/billing/status should return billing configuration status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/billing/status',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('configured');
    expect(typeof body.configured).toBe('boolean');
  });

  it('GET /api/v1/brands/connect/instagram should redirect to Meta OAuth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/platforms/connect/instagram',
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('facebook.com');
  });

  it('GET /api/v1/brands/connect/tiktok should redirect to TikTok OAuth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/platforms/connect/tiktok',
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('tiktok.com');
  });
});
