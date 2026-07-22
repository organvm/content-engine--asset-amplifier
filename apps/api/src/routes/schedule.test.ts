/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';
import { ScheduleStrategy } from '@cronus/domain';

vi.mock('@cronus/scheduler', () => ({
  scheduleContent: vi.fn().mockResolvedValue([{ id: 'pe-1' }, { id: 'pe-2' }]),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  then: function(resolve: (value: any) => void) {
    resolve([{ publish_events: { id: 'pe-1' } }, { publish_events: { id: 'pe-2' } }]);
  },
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    mapRows: vi.fn((rows) => rows),
    schema: {
      publishEvents: { content_unit_id: 'publish_events.content_unit_id' },
      contentUnits: { id: 'content_units.id', brand_id: 'content_units.brand_id' },
    },
    eq: vi.fn(),
  };
});

describe('Schedule Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/brands/:brandId/schedule should schedule content', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands/test-brand/schedule',
      payload: {
        content_unit_ids: ['cu-1', 'cu-2'],
        strategy: ScheduleStrategy.optimal,
      }
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('scheduled_count', 2);
    expect(body.publish_events).toEqual([{ id: 'pe-1' }, { id: 'pe-2' }]);
  });

  it('GET /api/v1/brands/:brandId/calendar should return scheduled events', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/calendar',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ id: 'pe-1' }, { id: 'pe-2' }]);
  });
});
