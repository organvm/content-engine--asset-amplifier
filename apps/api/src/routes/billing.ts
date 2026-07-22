import { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';
import { TIERS, getStatusConfig, createCheckoutSession, retrieveSession, getStripe, handleWebhookEvent } from '../billing-handler.js';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const raw = body as string;
      req.rawBody = raw;
      done(null, raw.length ? JSON.parse(raw) : {});
    } catch (err) {
      (err as { statusCode?: number }).statusCode = 400;
      done(err as Error);
    }
  });

  app.get('/billing/status', async (_request, reply) => {
    return reply.send(getStatusConfig());
  });

  app.post<{ Body: { tier: string; email?: string; brand_id?: string } }>('/billing/checkout', async (request, reply) => {
    const { tier, email, brand_id } = request.body;
    if (!TIERS.includes(tier as never)) {
      return reply.status(400).send({ error: `Invalid tier. Must be one of: ${TIERS.join(', ')}` });
    }
    try {
      const result = await createCheckoutSession(tier as never, email, brand_id);
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get<{ Params: { sessionId: string } }>('/billing/session/:sessionId', async (request, reply) => {
    try {
      const result = await retrieveSession(request.params.sessionId);
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.post('/billing/webhook', async (request, reply) => {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return reply.status(500).send({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
    }

    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(request.rawBody ?? '', signature, webhookSecret);
    } catch (err) {
      return reply.status(400).send({ error: `Webhook signature verification failed: ${(err as Error).message}` });
    }

    await handleWebhookEvent(event, app.log);
    return reply.send({ received: true });
  });
};
