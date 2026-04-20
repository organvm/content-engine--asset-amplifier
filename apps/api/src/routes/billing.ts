import { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';

const TIERS = ['creator', 'studio'] as const;
type Tier = (typeof TIERS)[number];

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key);
}

function getPriceId(tier: Tier): string {
  const map: Record<Tier, string | undefined> = {
    creator: process.env.STRIPE_PRICE_ID_CREATOR,
    studio: process.env.STRIPE_PRICE_ID_STUDIO,
  };
  const priceId = map[tier];
  if (!priceId) throw new Error(`STRIPE_PRICE_ID_${tier.toUpperCase()} is not configured`);
  return priceId;
}

export const billingRoutes: FastifyPluginAsync = async (app) => {
  // GET /status — returns Stripe config state
  app.get('/billing/status', async (_request, reply) => {
    const hasKey = !!process.env.STRIPE_SECRET_KEY;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
    const hasCreatorPrice = !!process.env.STRIPE_PRICE_ID_CREATOR;
    const hasStudioPrice = !!process.env.STRIPE_PRICE_ID_STUDIO;

    return reply.send({
      configured: hasKey && hasWebhookSecret && hasCreatorPrice && hasStudioPrice,
      stripe_key: hasKey,
      webhook_secret: hasWebhookSecret,
      price_creator: hasCreatorPrice,
      price_studio: hasStudioPrice,
    });
  });

  // POST /checkout — creates Stripe Checkout Session
  app.post<{ Body: { tier: Tier; email?: string } }>('/billing/checkout', async (request, reply) => {
    const { tier, email } = request.body;

    if (!TIERS.includes(tier)) {
      return reply.status(400).send({ error: `Invalid tier. Must be one of: ${TIERS.join(', ')}` });
    }

    const stripe = getStripe();
    const priceId = getPriceId(tier);
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      ...(email && { customer_email: email }),
      success_url: `${dashboardUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${dashboardUrl}/billing/cancel`,
      metadata: { tier },
    });

    return reply.send({ sessionId: session.id, url: session.url });
  });

  // GET /session/:sessionId — retrieves session for post-checkout
  app.get<{ Params: { sessionId: string } }>('/billing/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    return reply.send({
      id: session.id,
      status: session.status,
      customerEmail: session.customer_details?.email,
      tier: session.metadata?.tier,
      subscriptionId: typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id,
    });
  });

  // POST /webhook — handles checkout.session.completed
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
      event = stripe.webhooks.constructEvent(
        request.rawBody as string,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      return reply.status(400).send({ error: `Webhook signature verification failed: ${err.message}` });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Handle successful checkout — provision access based on tier
        const tier = session.metadata?.tier;
        const customerEmail = session.customer_details?.email;
        // TODO: Provision user access based on tier and email
        app.log.info({ tier, customerEmail, sessionId: session.id }, 'Checkout completed');
        break;
      }
      default:
        app.log.info({ type: event.type }, 'Unhandled webhook event');
    }

    return reply.send({ received: true });
  });
};
