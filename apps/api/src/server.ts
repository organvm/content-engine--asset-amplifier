import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { createLogger } from '@cronus/logger';
import { brandRoutes } from './routes/brands.js';
import { agencyRoutes } from './routes/agencies.js';
import { jobRoutes } from './routes/jobs.js';
import { assetRoutes } from './routes/assets.js';
import { contentRoutes } from './routes/content.js';
import { fragmentRoutes } from './routes/fragments.js';
import { naturalCenterRoutes } from './routes/natural-center.js';
import { scheduleRoutes } from './routes/schedule.js';
import { platformRoutes } from './routes/platforms.js';
import { analyticsRoutes } from './routes/analytics.js';
import { resizeRoutes } from './routes/resize.js';
import { authPlugin } from './plugins/auth.js';
import { settingsRoutes } from './routes/settings.js';
import { billingRoutes } from './routes/billing.js';
import { projectRoutes } from './routes/projects.js';
import { publicationVariantRoutes } from './routes/publication-variants.js';
import { linkedApplicationRoutes } from './routes/linked-applications.js';
import { conversionEventRoutes } from './routes/conversion-events.js';

const log = createLogger('api');

export async function buildApp() {
  const app = Fastify({ logger: false }); // we use our own logger

  await app.register(cors, { origin: true });
  await app.register(authPlugin);
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    const err = error as FastifyError;
    log.error({ err, url: request.url }, 'Request error');
    reply.status(err.statusCode ?? 500).send({
      error: err.message,
      statusCode: err.statusCode ?? 500,
    });
  });

  // Request logging
  app.addHook('onResponse', (request, reply, done) => {
    log.info({ method: request.method, url: request.url, status: reply.statusCode, ms: reply.elapsedTime?.toFixed(1) }, 'request');
    done();
  });

  // Routes
  await app.register(brandRoutes, { prefix: '/api/v1' });
  await app.register(agencyRoutes, { prefix: '/api/v1' });
  await app.register(jobRoutes, { prefix: '/api/v1' });
  await app.register(assetRoutes, { prefix: '/api/v1' });
  await app.register(contentRoutes, { prefix: '/api/v1' });
  await app.register(fragmentRoutes, { prefix: '/api/v1' });
  await app.register(naturalCenterRoutes, { prefix: '/api/v1' });
  await app.register(scheduleRoutes, { prefix: '/api/v1' });
  await app.register(platformRoutes, { prefix: '/api/v1' });
  await app.register(analyticsRoutes, { prefix: '/api/v1' });
  await app.register(resizeRoutes, { prefix: '/api/v1' });
  await app.register(settingsRoutes, { prefix: '/api/v1' });
  await app.register(billingRoutes, { prefix: '/api/v1' });
  await app.register(projectRoutes, { prefix: '/api/v1' });
  await app.register(publicationVariantRoutes, { prefix: '/api/v1' });
  await app.register(linkedApplicationRoutes, { prefix: '/api/v1' });
  await app.register(conversionEventRoutes, { prefix: '/api/v1' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}

async function start() {
  const app = await buildApp();
  const port = Number(process.env.API_PORT ?? 3000);
  const host = process.env.API_HOST ?? '0.0.0.0';

  await app.listen({ port, host });
  log.info(`API listening on ${host}:${port}`);

  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, async () => {
      log.info(`${signal} received, shutting down`);
      await app.close();
      process.exit(0);
    });
  }
}

// Only start the server when run directly (not imported by Worker)
const isDirectRun = process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');
if (isDirectRun) {
  start().catch((err) => {
    console.error('Failed to start API:', err);
    process.exit(1);
  });
}
