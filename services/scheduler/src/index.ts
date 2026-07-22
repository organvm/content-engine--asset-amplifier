import { getDb, schema } from '@cronus/db';
import { eq, and, inArray, lte } from '@cronus/db';
import { ApprovalStatus, PublishStatus, ScheduleStrategy } from '@cronus/domain';
import { createLogger } from '@cronus/logger';
import { createQueue } from '@cronus/queue';
import { randomUUID } from 'node:crypto';

const log = createLogger('scheduler');

/**
 * Schedules approved content units for publishing.
 * 
 * 1. Validates all provided content units are approved.
 * 2. Computes publish times based on the chosen strategy.
 * 3. Creates PublishEvent records.
 */
export async function scheduleContent(params: {
  brandId: string;
  contentUnitIds: string[];
  strategy: ScheduleStrategy;
  startDate: Date;
  endDate?: Date;
}) {
  const { brandId, contentUnitIds, strategy, startDate, endDate } = params;
  const db = getDb();

  log.info({ brandId, count: contentUnitIds.length, strategy }, 'Scheduling content');

  // 1. Fetch and validate units
  const units = await db
    .select()
    .from(schema.contentUnits)
    .where(
      inArray(schema.contentUnits.id, contentUnitIds)
    );

  const unapproved = units.filter(u => u.approval_status !== ApprovalStatus.approved);
  if (unapproved.length > 0) {
    throw new Error(`${unapproved.length} units are not approved and cannot be scheduled.`);
  }

  // 2. Compute publish times
  // Simple "Evenly Distributed" strategy for MVP
  const publishEvents = [];
  const durationMs = endDate 
    ? endDate.getTime() - startDate.getTime() 
    : contentUnitIds.length * 24 * 60 * 60 * 1000; // Default 1 post per day
  
  const intervalMs = durationMs / contentUnitIds.length;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const scheduledAt = new Date(startDate.getTime() + (i * intervalMs));

    // Find a platform connection for this platform
    const [connection] = await db
      .select()
      .from(schema.platformConnections)
      .where(and(
        eq(schema.platformConnections.platform, unit.platform),
        eq(schema.platformConnections.brand_id, brandId)
      ));

    if (!connection) {
      log.warn({ platform: unit.platform, brandId }, 'No active connection found for platform, skipping schedule');
      continue;
    }

    publishEvents.push({
      id: randomUUID(),
      content_unit_id: unit.id,
      platform_connection_id: connection.id,
      scheduled_at: scheduledAt,
      status: PublishStatus.scheduled,
      retry_count: 0,
    });
  }

  // 3. Persist events
  if (publishEvents.length > 0) {
    await db.insert(schema.publishEvents).values(publishEvents);
  }

  log.info({ scheduledCount: publishEvents.length }, 'Scheduling complete');
  return publishEvents;
}

/**
 * Queries all due publish_events (scheduled_at <= now and status = 'scheduled')
 * and dispatches them to BullMQ ('publish.execute').
 */
export async function dispatchDuePublishEvents(): Promise<string[]> {
  const db = getDb();
  const now = new Date();

  // Find due publish events
  const dueEvents = await db
    .select()
    .from(schema.publishEvents)
    .where(
      and(
        eq(schema.publishEvents.status, PublishStatus.scheduled),
        lte(schema.publishEvents.scheduled_at, now)
      )
    );

  if (dueEvents.length === 0) {
    return [];
  }

  log.info({ count: dueEvents.length }, 'Found due publish events to dispatch');

  const publishQueue = createQueue('publish.execute');
  const dispatchedIds: string[] = [];

  for (const event of dueEvents) {
    try {
      // Mark event as publishing to avoid duplicate enqueueing
      await db
        .update(schema.publishEvents)
        .set({ status: PublishStatus.publishing })
        .where(eq(schema.publishEvents.id, event.id));

      await publishQueue.add('publish.execute', {
        publishEventId: event.id,
      });

      dispatchedIds.push(event.id);
      log.info({ eventId: event.id }, 'Dispatched publish event to queue');
    } catch (err) {
      log.error({ err, eventId: event.id }, 'Failed to dispatch publish event');
      // Reset back to scheduled for retry
      await db
        .update(schema.publishEvents)
        .set({ status: PublishStatus.scheduled })
        .where(eq(schema.publishEvents.id, event.id));
    }
  }

  return dispatchedIds;
}

/**
 * Starts an in-memory background loop polling for due publish events.
 */
export function startSchedulerLoop(intervalMs = 60000): { stop: () => void } {
  log.info({ intervalMs }, 'Starting background scheduler dispatch loop');

  const timer = setInterval(async () => {
    try {
      const dispatched = await dispatchDuePublishEvents();
      if (dispatched.length > 0) {
        log.info({ dispatchedCount: dispatched.length }, 'Scheduler loop cycle dispatched events');
      }
    } catch (err) {
      log.error({ err }, 'Scheduler loop cycle error');
    }
  }, intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
      log.info('Scheduler dispatch loop stopped');
    },
  };
}
