import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, toCamel, mapRows } from '@cronus/db';
import { eq } from '@cronus/db';
import { randomUUID } from 'node:crypto';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const brandRoutes: FastifyPluginAsync = async (app) => {
  app.post('/brands', async (request, reply) => {
    const body = request.body as {
      name: string;
      description?: string;
      tone_description?: string;
      consistency_threshold?: number;
      agency_id?: string;
    };
    const db = getDb();

    const [brand] = await db.insert(schema.brands).values({
      name: body.name,
      slug: slugify(body.name) + '-' + randomUUID().slice(0, 6),
      description: body.description ?? null,
      tone_description: body.tone_description ?? null,
      consistency_threshold: body.consistency_threshold ?? 0.75,
      agency_id: body.agency_id ?? null,
    }).returning();

    reply.status(201).send(toCamel(brand));
  });

  app.get('/brands', async (request) => {
    const db = getDb();
    const { agency_id } = request.query as { agency_id?: string };

    const rows = agency_id
      ? await db.select().from(schema.brands).where(eq(schema.brands.agency_id, agency_id))
      : await db.select().from(schema.brands);

    return mapRows(rows);
  });

  app.get('/brands/:brandId', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
    if (!brand) return reply.status(404).send({ error: 'Brand not found' });

    return toCamel(brand);
  });

  app.patch('/brands/:brandId', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const body = request.body as Record<string, unknown>;
    const db = getDb();

    const [existing] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
    if (!existing) return reply.status(404).send({ error: 'Brand not found' });

    const allowed = ['name', 'description', 'tone_description', 'consistency_threshold', 'agency_id', 'status', 'brand_guidelines_url'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
      else {
        const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        if (body[camel] !== undefined) updates[key] = body[camel];
      }
    }
    if (Object.keys(updates).length === 0) return toCamel(existing);

    const [updated] = await db.update(schema.brands).set({ ...updates, updated_at: new Date() }).where(eq(schema.brands.id, brandId)).returning();
    return toCamel(updated);
  });
};
