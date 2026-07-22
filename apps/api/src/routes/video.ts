import { randomUUID } from 'node:crypto';
import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, eq, and } from '@cronus/db';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:video');

export const videoRoutes: FastifyPluginAsync = async (app) => {
  app.post('/brands/:brandId/render-video', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { asset_id, headline, watermark } = request.body as {
      asset_id: string;
      headline?: string;
      watermark?: string;
    };

    const db = getDb();

    const [asset] = await db
      .select()
      .from(schema.assets)
      .where(and(eq(schema.assets.id, asset_id), eq(schema.assets.brand_id, brandId)));

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    const [fragment] = await db
      .select()
      .from(schema.fragments)
      .where(eq(schema.fragments.asset_id, asset_id));

    if (!fragment) {
      return reply.status(404).send({ error: 'No fragments found for asset' });
    }

    await db
      .update(schema.assets)
      .set({ processing_status: 'rendering' })
      .where(eq(schema.assets.id, asset_id));

    const { createQueue } = await import('@cronus/queue');
    const queue = createQueue('render.video');
    await queue.add('render.video', {
      brandId,
      assetId: asset_id,
      fragmentId: fragment.id,
      headline,
      watermark,
    });

    log.info({ brandId, assetId: asset_id, fragmentId: fragment.id }, 'Video render job enqueued');
    return reply.status(202).send({ job_id: randomUUID(), status: 'enqueued' });
  });
};
