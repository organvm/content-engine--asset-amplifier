import { randomUUID } from 'node:crypto';
import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq, and, desc } from '@cronus/db';
import { ApprovalStatus, Platform } from '@cronus/domain';
import { generateAssetContent } from '@cronus/content-generation';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:content');

export const contentRoutes: FastifyPluginAsync = async (app) => {
  // POST /brands/:brandId/generate
  // Starts async content generation from an asset
  app.post('/brands/:brandId/generate', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { asset_id, platforms } = request.body as {
      asset_id: string;
      platforms?: Platform[];
      posts_per_fragment?: number
    };

    const db = getDb();

    // 1. Verify asset and brand
    const [asset] = await db
      .select()
      .from(schema.assets)
      .where(and(eq(schema.assets.id, asset_id), eq(schema.assets.brand_id, brandId)));

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    log.info({ brandId, assetId: asset_id }, 'Triggering content generation');

    const jobId = randomUUID();

    // Fire and forget — generation runs in background
    generateAssetContent({
      brandId,
      assetId: asset_id,
      platforms: platforms || [Platform.instagram_feed, Platform.linkedin, Platform.x] as Platform[],
    }).catch(err => log.error({ err, assetId: asset_id }, 'Generation failed'));

    return reply.status(202).send({ job_id: jobId, estimated_count: 30 });
  });

  // GET /brands/:brandId/content
  // List generated content units with filters
  app.get('/brands/:brandId/content', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const { approval_status, platform } = request.query as { 
      approval_status?: ApprovalStatus; 
      platform?: Platform 
    };

    const db = getDb();

    // Apply filters if provided
    // Note: Drizzle query building for dynamic filters
    const conditions = [eq(schema.contentUnits.brand_id, brandId)];
    if (approval_status) conditions.push(eq(schema.contentUnits.approval_status, approval_status));
    if (platform) conditions.push(eq(schema.contentUnits.platform, platform));

    const rows = await db
      .select()
      .from(schema.contentUnits)
      .where(and(...conditions))
      .orderBy(desc(schema.contentUnits.created_at));

    return mapRows(rows);
  });

  // GET /brands/:brandId/content/:contentUnitId
  // Get a single content unit by ID
  app.get('/brands/:brandId/content/:contentUnitId', async (request, reply) => {
    const { brandId, contentUnitId } = request.params as { brandId: string; contentUnitId: string };
    const db = getDb();

    const [row] = await db
      .select()
      .from(schema.contentUnits)
      .where(and(
        eq(schema.contentUnits.id, contentUnitId),
        eq(schema.contentUnits.brand_id, brandId),
      ));

    if (!row) return reply.status(404).send({ error: 'Content unit not found' });
    return mapRows([row])[0];
  });

  // POST /brands/:brandId/content/:contentUnitId/approve
  app.post('/brands/:brandId/content/:contentUnitId/approve', async (request, _reply) => {
    const { contentUnitId } = request.params as { contentUnitId: string };
    const db = getDb();

    await db.update(schema.contentUnits)
      .set({ approval_status: ApprovalStatus.approved })
      .where(eq(schema.contentUnits.id, contentUnitId));

    return { status: 'approved' };
  });

  // POST /brands/:brandId/content/:contentUnitId/reject
  app.post('/brands/:brandId/content/:contentUnitId/reject', async (request, _reply) => {
    const { contentUnitId } = request.params as { contentUnitId: string };
    const { reason } = request.body as { reason?: string };
    const db = getDb();

    await db.update(schema.contentUnits)
      .set({ 
        approval_status: ApprovalStatus.rejected,
        flagged_reason: reason || 'Manual rejection'
      })
      .where(eq(schema.contentUnits.id, contentUnitId));

    return { status: 'rejected' };
  });
};
