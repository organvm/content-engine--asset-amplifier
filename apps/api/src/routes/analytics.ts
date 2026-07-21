import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq, sql, desc } from '@cronus/db';
import { generateWeeklyReport, computeAssetAttribution } from '@cronus/analytics';

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/reports/weekly
  app.get('/brands/:brandId/reports/weekly', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const { week_of } = request.query as { week_of?: string };

    const report = await generateWeeklyReport(brandId, week_of ? new Date(week_of) : new Date());
    return report;
  });

  // GET /brands/:brandId/assets/:assetId/attribution
  app.get('/brands/:brandId/assets/:assetId/attribution', async (request) => {
    const { assetId } = request.params as { assetId: string };
    
    const attribution = await computeAssetAttribution(assetId);
    return attribution;
  });

  // GET /brands/:brandId/roi
  // Aggregated per-asset ROI metrics for the dashboard
  app.get('/brands/:brandId/roi', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    // Per-asset rollup of content count, views, engagement
    const rows = await db
      .select({
        asset_id: schema.assets.id,
        asset_name: schema.assets.original_filename,
        media_type: schema.assets.media_type,
        created_at: schema.assets.created_at,
        content_count: sql<number>`coalesce(count(${schema.contentUnits.id}), 0)`,
        approved_count: sql<number>`coalesce(sum(case when ${schema.contentUnits.approval_status} = 'approved' then 1 else 0 end), 0)`,
        platform_count: sql<number>`coalesce(count(distinct ${schema.contentUnits.platform}), 0)`,
        total_views: sql<number>`coalesce(sum(${schema.performanceObservations.views}), 0)`,
        total_engagement: sql<number>`coalesce(sum(${schema.performanceObservations.likes} + ${schema.performanceObservations.comments} + ${schema.performanceObservations.shares} + ${schema.performanceObservations.saves}), 0)`,
      })
      .from(schema.assets)
      .leftJoin(
        schema.fragments,
        eq(schema.fragments.asset_id, schema.assets.id)
      )
      .leftJoin(
        schema.contentUnits,
        eq(schema.contentUnits.fragment_id, schema.fragments.id)
      )
      .leftJoin(
        schema.publishEvents,
        eq(schema.publishEvents.content_unit_id, schema.contentUnits.id)
      )
      .leftJoin(
        schema.performanceObservations,
        eq(schema.performanceObservations.publish_event_id, schema.publishEvents.id)
      )
      .where(eq(schema.assets.brand_id, brandId))
      .groupBy(schema.assets.id, schema.assets.original_filename, schema.assets.media_type, schema.assets.created_at)
      .orderBy(desc(sql<number>`coalesce(sum(${schema.performanceObservations.views}), 0)`));

    return mapRows(rows);
  });
};
