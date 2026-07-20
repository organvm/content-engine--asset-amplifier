import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq, and } from '@cronus/db';

export const linkedApplicationRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/projects/:projectId/application
  app.get('/brands/:brandId/projects/:projectId/application', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const db = getDb();

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const [row] = await db.select().from(schema.linkedApplications)
      .where(eq(schema.linkedApplications.project_id, projectId));

    if (!row) return reply.status(404).send({ error: 'No linked application found' });
    return mapRows([row])[0];
  });

  // POST /brands/:brandId/projects/:projectId/application
  app.post('/brands/:brandId/projects/:projectId/application', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const body = request.body as {
      url: string;
      type?: string;
      ctaLabel: string;
      privacy?: string;
      trackingEnabled?: boolean;
      campaignKey?: string;
      allowedEvents?: string[];
    };
    const db = getDb();

    if (!body.url || !body.ctaLabel) {
      return reply.status(400).send({ error: 'url and ctaLabel are required' });
    }

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const [row] = await db.insert(schema.linkedApplications).values({
      project_id: projectId,
      url: body.url,
      type: body.type ?? 'other',
      cta_label: body.ctaLabel,
      privacy: body.privacy ?? 'public',
      tracking_enabled: body.trackingEnabled ?? false,
      campaign_key: body.campaignKey ?? null,
      allowed_events: body.allowedEvents ?? [],
    }).returning();

    // Update project's linked_application_id
    await db.update(schema.artworkProjects)
      .set({ linked_application_id: row.id, updated_at: new Date() })
      .where(eq(schema.artworkProjects.id, projectId));

    return mapRows([row])[0];
  });

  // PATCH /brands/:brandId/projects/:projectId/application/:appId
  app.patch('/brands/:brandId/projects/:projectId/application/:appId', async (request, reply) => {
    const { appId } = request.params as { appId: string };
    const body = request.body as Record<string, unknown>;
    const db = getDb();

    const allowed = ['url', 'type', 'cta_label', 'health_status', 'privacy',
      'tracking_enabled', 'campaign_key', 'allowed_events'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No valid fields to update' });
    }
    updates.updated_at = new Date();

    const [row] = await db.update(schema.linkedApplications)
      .set(updates)
      .where(eq(schema.linkedApplications.id, appId))
      .returning();

    if (!row) return reply.status(404).send({ error: 'Linked application not found' });
    return mapRows([row])[0];
  });

  // DELETE /brands/:brandId/projects/:projectId/application/:appId
  app.delete('/brands/:brandId/projects/:projectId/application/:appId', async (request, reply) => {
    const { projectId, appId } = request.params as { projectId: string; appId: string };
    const db = getDb();

    const [row] = await db.delete(schema.linkedApplications)
      .where(eq(schema.linkedApplications.id, appId))
      .returning();

    if (!row) return reply.status(404).send({ error: 'Linked application not found' });

    // Clear project's linked_application_id
    await db.update(schema.artworkProjects)
      .set({ linked_application_id: null, updated_at: new Date() })
      .where(eq(schema.artworkProjects.id, projectId));

    return { deleted: true };
  });
};
