import { JobPayloads } from '@cronus/queue';
import { createLogger } from '@cronus/logger';
import { getDb, schema, eq } from '@cronus/db';
import { getAdapter } from '@cronus/platform-adapter';
import { PublishStatus, ContentUnit, PlatformConnection } from '@cronus/domain';

const logger = createLogger('processor:publish');

export async function executePublish(data: JobPayloads['publish.execute']): Promise<void> {
  const { publishEventId } = data;
  logger.info({ publishEventId }, 'Executing publish event...');

  const db = getDb();

  // 1. Fetch publish event
  const [event] = await db
    .select()
    .from(schema.publishEvents)
    .where(eq(schema.publishEvents.id, publishEventId));

  if (!event) {
    throw new Error(`Publish event not found: ${publishEventId}`);
  }

  // 2. Fetch content unit
  const [unit] = await db
    .select()
    .from(schema.contentUnits)
    .where(eq(schema.contentUnits.id, event.content_unit_id));

  if (!unit) {
    throw new Error(`Content unit not found: ${event.content_unit_id}`);
  }

  // 3. Fetch platform connection
  const [connection] = await db
    .select()
    .from(schema.platformConnections)
    .where(eq(schema.platformConnections.id, event.platform_connection_id));

  if (!connection) {
    throw new Error(`Platform connection not found: ${event.platform_connection_id}`);
  }

  try {
    // 4. Update status to publishing
    await db
      .update(schema.publishEvents)
      .set({ status: PublishStatus.publishing })
      .where(eq(schema.publishEvents.id, publishEventId));

    // 5. Get adapter & publish
    const adapter = getAdapter(unit.platform as any);

    const contentUnitPayload: ContentUnit = {
      id: unit.id,
      fragmentId: unit.fragment_id,
      brandId: unit.brand_id,
      platform: unit.platform as any,
      caption: unit.caption,
      mediaKey: unit.media_key,
      mediaType: unit.media_type as any,
      hashtags: (unit.hashtags as string[]) || [],
      ncScore: unit.nc_score,
      ncScoreBreakdown: (unit.nc_score_breakdown as Record<string, number>) || {},
      approvalStatus: unit.approval_status as any,
      similarityHash: unit.similarity_hash,
      createdAt: unit.created_at,
    };

    const connectionPayload: PlatformConnection = {
      id: connection.id,
      brandId: connection.brand_id,
      platform: connection.platform as any,
      platformAccountId: connection.platform_account_id,
      platformAccountName: connection.platform_account_name || undefined,
      status: connection.status as any,
      accessToken: connection.access_token || undefined,
      refreshToken: connection.refresh_token || undefined,
      tokenExpiresAt: connection.token_expires_at || undefined,
      scopes: (connection.scopes as string[]) || [],
      rateLimitState: (connection.rate_limit_state as Record<string, unknown>) || {},
      createdAt: connection.created_at,
      updatedAt: connection.updated_at,
    };

    const result = await adapter.publish(contentUnitPayload, connectionPayload);

    // 6. Update publish event with success
    await db
      .update(schema.publishEvents)
      .set({
        status: PublishStatus.published,
        published_at: new Date(),
        platform_post_id: result.platformPostId,
        platform_post_url: result.platformPostUrl || null,
      })
      .where(eq(schema.publishEvents.id, publishEventId));

    logger.info({ publishEventId, postId: result.platformPostId }, 'Publish event executed successfully.');

  } catch (err: any) {
    logger.error({ err, publishEventId }, 'Publish event failed');
    await db
      .update(schema.publishEvents)
      .set({
        status: PublishStatus.failed,
        error_message: err.message || String(err),
      })
      .where(eq(schema.publishEvents.id, publishEventId));

    throw err;
  }
}
