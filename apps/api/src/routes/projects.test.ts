import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 'proj-1', title: 'New Project' }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  then: function(resolve: any) {
    resolve([{ id: 'proj-1', brand_id: 'test-brand' }]);
  },
};

vi.mock('@cronus/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cronus/db')>();
  return {
    ...actual,
    getDb: vi.fn(() => mockDb),
    mapRows: vi.fn((rows) => rows),
    schema: {
      artworkProjects: { id: 'artwork_projects.id', brand_id: 'artwork_projects.brand_id' },
      linkedApplications: { project_id: 'linked_applications.project_id' },
      publicationVariants: { project_id: 'publication_variants.project_id' },
    },
    eq: vi.fn(),
    and: vi.fn(),
  };
});

describe('Projects Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/brands/:brandId/projects should return projects', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/projects',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ id: 'proj-1', brand_id: 'test-brand' }]);
  });

  it('POST /api/v1/brands/:brandId/projects should create project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/brands/test-brand/projects',
      payload: { title: 'New Project' }
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 'proj-1', title: 'New Project' });
  });

  it('GET /api/v1/brands/:brandId/projects/:projectId should return project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/projects/proj-1',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: 'proj-1', brand_id: 'test-brand' });
  });

  it('PATCH /api/v1/brands/:brandId/projects/:projectId should update project', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/brands/test-brand/projects/proj-1',
      payload: { title: 'Updated Project' }
    });
    expect(response.statusCode).toBe(200);
  });

  it('GET /api/v1/brands/:brandId/projects/:projectId/manifest should return manifest', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/brands/test-brand/projects/proj-1/manifest',
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('title');
  });
});
