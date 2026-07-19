import { FastifyPluginAsync } from 'fastify';
import { getDb, schema } from '@cronus/db';
import { eq, and, desc } from '@cronus/db';
import { ingestAsset } from '@cronus/asset-ingestion';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:assets');

export const assetRoutes: FastifyPluginAsync = async (app) => {
  // POST /brands/:brandId/assets
  // Uploads a single asset and triggers background processing
  app.post('/brands/:brandId/assets', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    // 1. Verify brand exists
    const [brand] = await db
      .select()
      .from(schema.brands)
      .where(eq(schema.brands.id, brandId));

    if (!brand) {
      return reply.status(404).send({ error: 'Brand not found' });
    }

    // 2. Extract file from multipart request
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    log.info({ brandId, filename: data.filename, mimetype: data.mimetype }, 'Received asset upload');

    try {
      // 3. Process buffer and ingest
      // Note: fastify-multipart handles the file stream, we convert to Buffer for simplicity in MVP
      const buffer = await data.toBuffer();
      
      const asset = await ingestAsset({
        brandId,
        buffer,
        originalFilename: data.filename,
        contentType: data.mimetype,
      });

      return reply.status(201).send(asset);
    } catch (err) {
      log.error({ err, brandId }, 'Asset upload failed');
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  // GET /brands/:brandId/assets
  // List all assets for a brand, newest first
  app.get('/brands/:brandId/assets', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    return db
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.brand_id, brandId))
      .orderBy(desc(schema.assets.created_at));
  });

  // GET /brands/:brandId/assets/:assetId
  // Get detailed status of a specific asset
  app.get('/brands/:brandId/assets/:assetId', async (request, reply) => {
    const { brandId, assetId } = request.params as { brandId: string; assetId: string };
    const db = getDb();

    const [asset] = await db
      .select()
      .from(schema.assets)
      .where(
        and(
          eq(schema.assets.id, assetId),
          eq(schema.assets.brand_id, brandId)
        )
      );

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    return asset;
  });
};
