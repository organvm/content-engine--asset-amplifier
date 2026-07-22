import Stripe from 'stripe';
import { getDb, schema, eq } from '@cronus/db';

export const TIERS = ['creator', 'studio'] as const;
export type Tier = (typeof TIERS)[number];

export function getStripe(key?: string): Stripe {
  const secret = key ?? process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(secret);
}

export function getPriceId(tier: Tier): string {
  const map: Record<Tier, string | undefined> = {
    creator: process.env.STRIPE_PRICE_ID_CREATOR,
    studio: process.env.STRIPE_PRICE_ID_STUDIO,
  };
  const priceId = map[tier];
  if (!priceId) throw new Error(`STRIPE_PRICE_ID_${tier.toUpperCase()} is not configured`);
  return priceId;
}

export function getStatusConfig() {
  return {
    configured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET && !!process.env.STRIPE_PRICE_ID_CREATOR && !!process.env.STRIPE_PRICE_ID_STUDIO,
    stripe_key: !!process.env.STRIPE_SECRET_KEY,
    webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET,
    price_creator: !!process.env.STRIPE_PRICE_ID_CREATOR,
    price_studio: !!process.env.STRIPE_PRICE_ID_STUDIO,
  };
}

export async function createCheckoutSession(tier: Tier, email?: string, brand_id?: string) {
  const stripe = getStripe();
  const priceId = getPriceId(tier);
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';

  const metadata: Record<string, string> = { tier };
  if (brand_id) metadata.brand_id = brand_id;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    ...(email && { customer_email: email }),
    success_url: `${dashboardUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${dashboardUrl}/billing/cancel`,
    metadata,
  });

  return { sessionId: session.id, url: session.url };
}

export async function retrieveSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  });

  return {
    id: session.id,
    status: session.status,
    customerEmail: session.customer_details?.email,
    tier: session.metadata?.tier,
    subscriptionId: typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id,
  };
}

export async function handleWebhookEvent(event: Stripe.Event, log?: { info: (obj: Record<string, unknown>, msg: string) => void; warn: (obj: Record<string, unknown>, msg: string) => void; error: (obj: Record<string, unknown>, msg: string) => void }) {
  const logger = log ?? {
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tier = session.metadata?.tier;
      const brandId = session.metadata?.brand_id;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      logger.info({ tier, brandId, customerEmail: session.customer_details?.email, sessionId: session.id }, 'Checkout completed');

      if (brandId && tier && customerId) {
        try {
          const db = getDb();
          await db.update(schema.brands)
            .set({
              stripe_customer_id: customerId,
              subscription_tier: tier,
              subscription_status: 'active',
              subscription_id: subscriptionId ?? null,
            })
            .where(eq(schema.brands.id, brandId));
          logger.info({ brandId, tier, customerId }, 'Brand subscription provisioned');
        } catch (err) {
          logger.error({ err, brandId, sessionId: session.id }, 'Failed to provision brand subscription');
        }
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as unknown as Record<string, unknown>;
      logger.warn({ customerId: invoice.customer, subscriptionId: invoice.subscription }, 'Invoice payment failed');
      break;
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const custId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      if (custId) {
        try {
          const db = getDb();
          const [brand] = await db.select({ id: schema.brands.id })
            .from(schema.brands)
            .where(eq(schema.brands.stripe_customer_id, custId));
          if (brand) {
            await db.update(schema.brands)
              .set({ subscription_status: subscription.status })
              .where(eq(schema.brands.id, brand.id));
            logger.info({ brandId: brand.id, status: subscription.status }, 'Brand subscription status updated');
          }
        } catch (err) {
          logger.error({ err, custId }, 'Failed to update subscription status');
        }
      }
      break;
    }
    default:
      logger.info({ type: event.type }, 'Unhandled webhook event');
  }
}
