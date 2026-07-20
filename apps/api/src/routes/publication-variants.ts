import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq, and, asc } from '@cronus/db';

export const publicationVariantRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/projects/:projectId/variants
  app.get('/brands/:brandId/projects/:projectId/variants', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const db = getDb();

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const rows = await db.select().from(schema.publicationVariants)
      .where(eq(schema.publicationVariants.project_id, projectId))
      .orderBy(asc(schema.publicationVariants.sort_order));
    return mapRows(rows);
  });

  // POST /brands/:brandId/projects/:projectId/variants
  app.post('/brands/:brandId/projects/:projectId/variants', async (request, reply) => {
    const { brandId, projectId } = request.params as { brandId: string; projectId: string };
    const body = request.body as {
      platform: string;
      format?: string;
      editorialRole?: string;
      caption: string;
      altText?: string;
      headline?: string;
      ctaLabel?: string;
      destinationUrl?: string;
      assetIds?: string[];
    };
    const db = getDb();

    if (!body.platform || !body.caption) {
      return reply.status(400).send({ error: 'platform and caption are required' });
    }

    const [project] = await db.select().from(schema.artworkProjects)
      .where(and(
        eq(schema.artworkProjects.id, projectId),
        eq(schema.artworkProjects.brand_id, brandId),
      ));
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const [row] = await db.insert(schema.publicationVariants).values({
      project_id: projectId,
      platform: body.platform,
      format: body.format ?? 'single',
      editorial_role: body.editorialRole ?? 'seed',
      caption: body.caption,
      alt_text: body.altText ?? null,
      headline: body.headline ?? null,
      cta_label: body.ctaLabel ?? null,
      destination_url: body.destinationUrl ?? null,
      asset_ids: body.assetIds ?? [],
    }).returning();

    return mapRows([row])[0];
  });

  // PATCH /brands/:brandId/projects/:projectId/variants/:variantId
  app.patch('/brands/:brandId/projects/:projectId/variants/:variantId', async (request, reply) => {
    const { projectId, variantId } = request.params as { projectId: string; variantId: string };
    const body = request.body as Record<string, unknown>;
    const db = getDb();

    const allowed = ['platform', 'format', 'editorial_role', 'caption', 'alt_text',
      'headline', 'cta_label', 'destination_url', 'asset_ids', 'approval_status',
      'sort_order', 'content_unit_id'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No valid fields to update' });
    }
    updates.updated_at = new Date();

    const [row] = await db.update(schema.publicationVariants)
      .set(updates)
      .where(eq(schema.publicationVariants.id, variantId))
      .returning();

    if (!row) return reply.status(404).send({ error: 'Variant not found' });
    return mapRows([row])[0];
  });

  // DELETE /brands/:brandId/projects/:projectId/variants/:variantId
  app.delete('/brands/:brandId/projects/:projectId/variants/:variantId', async (request, reply) => {
    const { variantId } = request.params as { variantId: string };
    const db = getDb();

    const [row] = await db.delete(schema.publicationVariants)
      .where(eq(schema.publicationVariants.id, variantId))
      .returning();

    if (!row) return reply.status(404).send({ error: 'Variant not found' });
    return { deleted: true };
  });
};
