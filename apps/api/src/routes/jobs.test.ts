import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

const mockGetJob = vi.fn().mockResolvedValue(null);
const mockGetState = vi.fn().mockResolvedValue('completed');

vi.mock('@cronus/queue', () => {
  return {
    Queue: vi.fn().mockImplementation(function(this: any, name: string) {
      this.name = name;
      this.getJob = mockGetJob;
      this.close = vi.fn();
    }),
    getRedisConnection: vi.fn().mockReturnValue({}),
  };
});

describe('Jobs Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/jobs/:jobId should return job details if found', async () => {
    mockGetJob.mockResolvedValueOnce({
      id: 'job-123',
      getState: mockGetState,
      progress: 100,
      returnvalue: { result: 'ok' },
      timestamp: 1672531200000,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/job-123',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      id: 'job-123',
      type: 'asset.process', // Matches the first queue in the list
      status: 'completed',
      progress: 100,
      result: { result: 'ok' },
      error: null,
      created_at: new Date(1672531200000).toISOString(),
    });
  });

  it('GET /api/v1/jobs/:jobId should return 404 if not found', async () => {
    mockGetJob.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/job-not-found',
    });

    expect(response.statusCode).toBe(404);
  });
});
