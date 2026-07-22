import { getDb, schema, eq } from '@cronus/db';
import { createLogger } from '@cronus/logger';
import { randomUUID } from 'node:crypto';

const log = createLogger('audience-engine');

export interface FunnelStepMetric {
  eventType: string;
  count: number;
  conversionRate: number; // percentage relative to preceding step
}

export interface ProjectFunnelMetrics {
  projectId: string;
  totalEvents: number;
  uniqueSessions: number;
  funnel: FunnelStepMetric[];
}

/**
 * Pure math function to compute step-by-step conversion rates for funnel steps.
 */
export function computeFunnelStepMetrics(events: Array<{ event_type: string; anonymous_session_id: string }>): {
  totalEvents: number;
  uniqueSessions: number;
  funnel: FunnelStepMetric[];
} {
  const totalEvents = events.length;
  const uniqueSessions = new Set(events.map(e => e.anonymous_session_id)).size;

  const funnelOrder = ['project_view', 'essay_open', 'application_start', 'relay_complete'];
  const countsByType: Record<string, number> = {};

  events.forEach(e => {
    countsByType[e.event_type] = (countsByType[e.event_type] || 0) + 1;
  });

  const funnel: FunnelStepMetric[] = [];
  let prevCount = 0;

  funnelOrder.forEach((step, index) => {
    const count = countsByType[step] || 0;
    const conversionRate = index === 0
      ? 100
      : prevCount > 0
        ? Math.round((count / prevCount) * 100)
        : 0;

    funnel.push({
      eventType: step,
      count,
      conversionRate,
    });

    prevCount = count;
  });

  return { totalEvents, uniqueSessions, funnel };
}

/**
 * Records an anonymous conversion event for an Artwork Project.
 */
export async function recordConversionEvent(params: {
  projectId: string;
  publishEventId?: string;
  anonymousSessionId: string;
  eventType: string;
  source?: string;
  medium?: string;
  campaign?: string;
  metadata?: Record<string, unknown>;
}) {
  const { projectId, publishEventId, anonymousSessionId, eventType, source, medium, campaign, metadata } = params;
  const db = getDb();

  log.info({ projectId, eventType, anonymousSessionId }, 'Recording conversion event');

  const [event] = await db
    .insert(schema.conversionEvents)
    .values({
      id: randomUUID(),
      project_id: projectId,
      publish_event_id: publishEventId || null,
      anonymous_session_id: anonymousSessionId,
      event_type: eventType,
      source: source || null,
      medium: medium || null,
      campaign: campaign || null,
      metadata: metadata || {},
    })
    .returning();

  return event;
}

/**
 * Computes conversion funnel metrics for an Artwork Project.
 */
export async function getProjectFunnelMetrics(projectId: string): Promise<ProjectFunnelMetrics> {
  const db = getDb();

  const events = await db
    .select()
    .from(schema.conversionEvents)
    .where(eq(schema.conversionEvents.project_id, projectId));

  const { totalEvents, uniqueSessions, funnel } = computeFunnelStepMetrics(events);

  return {
    projectId,
    totalEvents,
    uniqueSessions,
    funnel,
  };
}
