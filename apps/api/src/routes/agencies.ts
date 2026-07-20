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
    const body = request.body as Record<string, unknown>;
    const db = getDb();

    const name = body.name as string;
    const contactEmail = (body.contactEmail ?? body.contact_email) as string;
    const logoUrl = (body.logoUrl ?? body.logo_url) as string | undefined;
    const primaryColor = (body.primaryColor ?? body.primary_color) as string | undefined;

    if (!name || !contactEmail) {
      return reply.status(400).send({ error: 'name and contactEmail are required' });
    }

    const [agency] = await db.insert(schema.agencies).values({
      name,
      slug: slugify(name) + '-' + randomUUID().slice(0, 6),
      contact_email: contactEmail,
      logo_url: logoUrl ?? null,
      primary_color: primaryColor ?? null,
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
