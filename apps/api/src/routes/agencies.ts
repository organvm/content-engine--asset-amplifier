import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, toCamel, mapRows } from '@cronus/db';
import { eq } from '@cronus/db';
import { randomUUID } from 'node:crypto';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const agencyRoutes: FastifyPluginAsync = async (app) => {
  // GET /agencies — list all agencies
  app.get('/agencies', async () => {
    const db = getDb();
    return mapRows(await db.select().from(schema.agencies));
  });

  app.post('/agencies', async (request, reply) => {
    const body = request.body as { name: string; contact_email: string; logo_url?: string; primary_color?: string };
    const db = getDb();

    const [agency] = await db.insert(schema.agencies).values({
      name: body.name,
      slug: slugify(body.name) + '-' + randomUUID().slice(0, 6),
      contact_email: body.contact_email,
      logo_url: body.logo_url ?? null,
      primary_color: body.primary_color ?? null,
    }).returning();

    reply.status(201).send(toCamel(agency));
  });

  app.get('/agencies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const [agency] = await db.select().from(schema.agencies).where(eq(schema.agencies.id, id));
    if (!agency) return reply.status(404).send({ error: 'Agency not found' });

    return toCamel(agency);
  });

  app.get('/agencies/:id/brands', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    return mapRows(await db.select().from(schema.brands).where(eq(schema.brands.agency_id, id)));
  });
};
