import { getDb, schema } from '@cronus/db';
import { eq, and } from '@cronus/db';
import { Platform, PlatformConnection, PublishStatus } from '@cronus/domain';
import { getAdapter } from '@cronus/platform-adapter';
import { createLogger } from '@cronus/logger';
import { randomUUID } from 'node:crypto';

const log = createLogger('analytics:collector');

/**
 * Collects metrics for all published posts of a brand.
 */
export async function collectMetrics(brandId: string) {
  const db = getDb();

  log.info({ brandId }, 'Collecting metrics for brand');

  // 1. Find all published events for this brand (joined through content_units)
  const events = await db
    .select({ publishEvent: schema.publishEvents })
    .from(schema.publishEvents)
    .innerJoin(schema.contentUnits, eq(schema.publishEvents.content_unit_id, schema.contentUnits.id))
    .where(and(
      eq(schema.publishEvents.status, PublishStatus.published),
      eq(schema.contentUnits.brand_id, brandId)
    ));

  if (events.length === 0) return;

  for (const { publishEvent } of events) {
    try {
      if (!publishEvent.platform_post_id) continue;

      // 2. Get connection and adapter
      const [connection] = await db
        .select()
        .from(schema.platformConnections)
        .where(eq(schema.platformConnections.id, publishEvent.platform_connection_id));

      if (!connection) continue;

      const adapter = getAdapter(connection.platform as Platform);

      // 3. Fetch metrics from platform
      const metrics = await adapter.fetchMetrics(publishEvent.platform_post_id, connection as unknown as PlatformConnection);

      // 4. Record observation
      await db.insert(schema.performanceObservations).values({
        id: randomUUID(),
        publish_event_id: publishEvent.id,
        observed_at: new Date(),
        views: metrics.views,
        reach: metrics.reach || 0,
        likes: Number(metrics.raw?.likes ?? 0),
        comments: Number(metrics.raw?.comments ?? 0),
        shares: Number(metrics.raw?.shares ?? 0),
        saves: Number(metrics.raw?.saves ?? 0),
        clicks: Number(metrics.raw?.clicks ?? 0),
        raw_metrics: metrics.raw,
      });

      log.debug({ eventId: publishEvent.id }, 'Recorded metrics observation');

    } catch (err) {
      log.error({ err, eventId: publishEvent.id }, 'Failed to collect metrics for event');
    }
  }

  log.info({ brandId }, 'Metrics collection complete');
}
