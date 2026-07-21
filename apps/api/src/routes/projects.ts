import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq, and } from '@cronus/db';

export const projectRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/projects
  app.get('/brands/:brandId/projects', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();
    const rows = await db.select().from(schema.artworkProjects)
      .where(eq(schema.artworkProjects.brand_id, brandId));
    return mapRows(rows);
  });

  // POST /brands/:brandId/projects
  app.post('/brands/:brandId/projects', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const body = request.body as {
      title: string;
      subtitle?: string;
      projectType?: string;
      hashtagTitle?: string[];
      keywords?: string[];
    };
    const db = getDb();

    if (!body.title) return reply.status(400).send({ error: 'title is required' });

    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const [row] = await db.insert(schema.artworkProjects).values({
      brand_id: brandId,
      slug,
      title: body.title,
      subtitle: body.subtitle ?? null,
      project_type: body.projectType ?? 'artwork',
      hashtag_title: body.hashtagTitle ?? [],
      keywords: body.keywords ?? [],
    }).returning();

    return mapRows([row])[0];
  });

  // GET /brands/:brandId/projects/:projectId
  app.get('/brands/:brandId/projects/:projectId', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const db = getDb();

    const [row] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));

    if (!row) return reply.status(404).send({ error: 'Project not found' });
    return mapRows([row])[0];
  });

  // PATCH /brands/:brandId/projects/:projectId
  app.patch('/brands/:brandId/projects/:projectId', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const body = request.body as Record<string, unknown>;
    const db = getDb();

    // Only allow updating safe fields
    const allowed = ['title', 'subtitle', 'status', 'project_type', 'canonical_url',
      'hashtag_title', 'keywords', 'influences', 'canonical_essay', 'artist_statement',
      'process_note', 'credits', 'rights', 'hero_asset_id', 'source_asset_ids'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No valid fields to update' });
    }
    updates.updated_at = new Date();

    const [row] = await db.update(schema.artworkProjects)
      .set(updates)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ))
      .returning();

    if (!row) return reply.status(404).send({ error: 'Project not found' });
    return mapRows([row])[0];
  });

  // POST /brands/:brandId/projects/:projectId/assets — attach source asset
  app.post('/brands/:brandId/projects/:projectId/assets', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const body = request.body as { assetId: string };
    const db = getDb();

    if (!body.assetId) return reply.status(400).send({ error: 'assetId is required' });

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const currentIds = (project.source_asset_ids as string[]) ?? [];
    if (currentIds.includes(body.assetId)) {
      return reply.status(409).send({ error: 'Asset already attached' });
    }

    const [updated] = await db.update(schema.artworkProjects)
      .set({
        source_asset_ids: [...currentIds, body.assetId],
        updated_at: new Date(),
      })
      .where(eq(schema.artworkProjects.id, projectId))
      .returning();

    return mapRows([updated])[0];
  });

  // DELETE /brands/:brandId/projects/:projectId/assets/:assetId — detach source asset
  app.delete('/brands/:brandId/projects/:projectId/assets/:assetId', async (request, reply) => {
    const { projectId, assetId } = request.params as { projectId: string; assetId: string };
    const db = getDb();

    const [project] = await db.select().from(schema.artworkProjects)
      .where(eq(schema.artworkProjects.id, projectId));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const currentIds = (project.source_asset_ids as string[]) ?? [];
    const filtered = currentIds.filter(id => id !== assetId);

    const [updated] = await db.update(schema.artworkProjects)
      .set({
        source_asset_ids: filtered,
        updated_at: new Date(),
      })
      .where(eq(schema.artworkProjects.id, projectId))
      .returning();

    return mapRows([updated])[0];
  });

  // GET /brands/:brandId/projects/:projectId/manifest
  app.get('/brands/:brandId/projects/:projectId/manifest', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const db = getDb();

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));

    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const [appRow] = await db.select().from(schema.linkedApplications)
      .where(eq(schema.linkedApplications.project_id, projectId));

    const variants = await db.select().from(schema.publicationVariants)
      .where(eq(schema.publicationVariants.project_id, projectId));

    const sourceIds = (project.source_asset_ids as string[]) ?? [];

    const manifest = {
      id: project.slug || project.id,
      title: project.hashtag_title || [],
      seedAsset: project.hero_asset_id || (sourceIds[0] ?? null),
      participation: appRow?.type || 'two-person-relay',
      protocols: ['mirror', 'echo', 'drift'],
      operators: ['repeat', 'self-view', 'role-swap', 'recursive-insertion'],
      exports: ['1:1', '4:5', '9:16', 'loop', 'lineage-card'],
      route: appRow?.url || project.canonical_url || '',
      canonicalEssay: project.canonical_essay || null,
      variants: variants.map(v => ({
        platform: v.platform,
        format: v.format,
        role: v.editorial_role
      }))
    };

    return manifest;
  });
};
