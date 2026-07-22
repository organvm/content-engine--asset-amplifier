import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq, and, gte, lte } from '@cronus/db';
import { scheduleContent } from '@cronus/scheduler';
import { ScheduleStrategy } from '@cronus/domain';

export const scheduleRoutes: FastifyPluginAsync = async (app) => {
  // POST /brands/:brandId/schedule
  app.post('/brands/:brandId/schedule', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { content_unit_ids, strategy, start_date, end_date } = request.body as {
      content_unit_ids: string[];
      strategy?: ScheduleStrategy;
      start_date?: string;
      end_date?: string;
    };

    try {
      const publishEvents = await scheduleContent({
        brandId,
        contentUnitIds: content_unit_ids,
        strategy: strategy || ScheduleStrategy.optimal,
        startDate: start_date ? new Date(start_date) : new Date(),
        endDate: end_date ? new Date(end_date) : undefined,
      });

      return reply.status(201).send({
        scheduled_count: publishEvents.length,
        publish_events: publishEvents,
      });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  // GET /brands/:brandId/calendar
  app.get('/brands/:brandId/calendar', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const { start_date, end_date } = request.query as { start_date?: string; end_date?: string };
    const db = getDb();

    // Must join through content_units to filter by brand
    const conditions = [eq(schema.contentUnits.brand_id, brandId)];

    if (start_date) {
      conditions.push(gte(schema.publishEvents.scheduled_at, new Date(start_date)));
    }
    if (end_date) {
      conditions.push(lte(schema.publishEvents.scheduled_at, new Date(end_date)));
    }

    const rows = await db
      .select()
      .from(schema.publishEvents)
      .innerJoin(schema.contentUnits, eq(schema.publishEvents.content_unit_id, schema.contentUnits.id))
      .where(and(...conditions));
    return mapRows(rows.map(r => r.publish_events));
  });
};
