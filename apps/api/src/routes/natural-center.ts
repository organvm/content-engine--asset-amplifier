import { randomUUID } from 'node:crypto';
import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, toCamel } from '@cronus/db';
import { eq } from '@cronus/db';
import { deriveNaturalCenter, refineNaturalCenter } from '@cronus/natural-center';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:natural-center');

export const naturalCenterRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/natural-center
  app.get('/brands/:brandId/natural-center', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    const [nc] = await db
      .select()
      .from(schema.naturalCenters)
      .where(eq(schema.naturalCenters.brand_id, brandId));

    if (!nc) {
      return reply.status(404).send({ error: 'No identity profile derived for this brand yet' });
    }

    return toCamel(nc);
  });

  // POST /brands/:brandId/natural-center
  // Triggers (re)derivation of brand identity
  app.post('/brands/:brandId/natural-center', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { asset_ids, tone_description } = request.body as { 
      asset_ids?: string[]; 
      tone_description?: string 
    };

    log.info({ brandId }, 'Triggering NC derivation');

    // For MVP, we run synchronously or in background without full workflow yet
    deriveNaturalCenter({
      brandId,
      assetIds: asset_ids || [],
      toneDescription: tone_description,
    }).catch(err => log.error({ err, brandId }, 'NC derivation background failed'));

    const jobId = randomUUID();

    return reply.status(202).send({ job_id: jobId, status: 'processing' });
  });

  // PATCH /brands/:brandId/natural-center
  // Refines specific dimensions of the profile
  app.patch('/brands/:brandId/natural-center', async (request, _reply) => {
    const { brandId } = request.params as { brandId: string };
    const { adjustments } = request.body as { adjustments: Record<string, string> };

    await refineNaturalCenter({ brandId, adjustments });

    return { status: 'refined' };
  });

  // POST /brands/:brandId/natural-center/inquiries/:inquiryId/answer
  app.post('/brands/:brandId/natural-center/inquiries/:inquiryId/answer', async (request, reply) => {
    const { brandId, inquiryId } = request.params as { brandId: string; inquiryId: string };
    const { answer } = request.body as { answer: string };
    const db = getDb();

    // 1. Fetch NC
    const [nc] = await db.select().from(schema.naturalCenters).where(eq(schema.naturalCenters.brand_id, brandId));
    if (!nc) return reply.status(404).send({ error: 'NC not found' });

    // 2. Update inquiry status
    const inquiries = ((nc.inquiries as Array<Record<string, unknown>>) || []).map(iq => {
      if (iq.id === inquiryId) {
        return { ...iq, status: 'answered', answer };
      }
      return iq;
    });

    // 3. Trigger refinement based on answer (T037)
    // For MVP, we'll just store the answer. Production would re-derive.
    await db.update(schema.naturalCenters)
      .set({ inquiries })
      .where(eq(schema.naturalCenters.id, nc.id));

    return { status: 'answered' };
  });
};
