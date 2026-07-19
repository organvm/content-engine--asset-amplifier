import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq, and, desc, sql } from '@cronus/db';

export const conversionEventRoutes: FastifyPluginAsync = async (app) => {
  // POST /brands/:brandId/projects/:projectId/events — ingest a conversion event
  app.post('/brands/:brandId/projects/:projectId/events', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const body = request.body as {
      anonymousSessionId: string;
      eventType: string;
      publishEventId?: string;
      source?: string;
      medium?: string;
      campaign?: string;
      metadata?: Record<string, unknown>;
    };
    const db = getDb();

    if (!body.anonymousSessionId || !body.eventType) {
      return reply.status(400).send({ error: 'anonymousSessionId and eventType are required' });
    }

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const [row] = await db.insert(schema.conversionEvents).values({
      project_id: projectId,
      anonymous_session_id: body.anonymousSessionId,
      event_type: body.eventType,
      publish_event_id: body.publishEventId ?? null,
      source: body.source ?? null,
      medium: body.medium ?? null,
      campaign: body.campaign ?? null,
      metadata: body.metadata ?? {},
    }).returning();

    return reply.status(201).send(mapRows([row])[0]);
  });

  // GET /brands/:brandId/projects/:projectId/events — list events
  app.get('/brands/:brandId/projects/:projectId/events', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const db = getDb();

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const rows = await db.select().from(schema.conversionEvents)
      .where(eq(schema.conversionEvents.project_id, projectId))
      .orderBy(desc(schema.conversionEvents.occurred_at))
      .limit(100);
    return mapRows(rows);
  });

  // GET /brands/:brandId/projects/:projectId/funnel — aggregated funnel counts
  app.get('/brands/:brandId/projects/:projectId/funnel', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const db = getDb();

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const rows = await db.select({
      event_type: schema.conversionEvents.event_type,
      count: sql<number>`count(*)::int`,
    })
      .from(schema.conversionEvents)
      .where(eq(schema.conversionEvents.project_id, projectId))
      .groupBy(schema.conversionEvents.event_type);

    return mapRows(rows);
  });
};
