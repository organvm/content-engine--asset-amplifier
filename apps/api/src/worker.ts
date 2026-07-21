/**
 * Cloudflare Worker — Cronus Metabolus API
 * Hono + Neon PostgreSQL + Cloudflare R2 + Multi-provider AI
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type Stripe from 'stripe';
import { getDb, schema, toCamel, mapRows, eq, desc, inArray } from '@cronus/db';
import { resolveProviders } from '@cronus/config';

type Bindings = {
  ASSETS_BUCKET: R2Bucket;
  DATABASE_URL: string;
  API_KEY: string; // allow-secret
  ENCRYPTION_KEY: string; // allow-secret
  GROQ_API_KEY?: string; // allow-secret
  GEMINI_API_KEY?: string; // allow-secret
  CEREBRAS_API_KEY?: string; // allow-secret
  ANTHROPIC_API_KEY?: string; // allow-secret
  OPENAI_API_KEY?: string; // allow-secret
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string; // allow-secret
  STRIPE_SECRET_KEY?: string; // allow-secret
  STRIPE_WEBHOOK_SECRET?: string; // allow-secret
  STRIPE_PRICE_ID_CREATOR?: string;
  STRIPE_PRICE_ID_STUDIO?: string;
  DASHBOARD_URL?: string;
  [key: string]: unknown;
};

const app = new Hono<{ Bindings: Bindings }>();

// Inject env vars from Worker bindings into process.env
app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(c.env)) {
    if (typeof value === 'string') process.env[key] = value;
  }
  // Ensure production mode (skips Ollama localhost check)
  process.env.NODE_ENV = 'production';
  await next();
});

app.use('*', cors());

// ── Health ────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Brands CRUD ───────────────────────────────────────────────
app.get('/api/v1/brands', async (c) => {
  const db = getDb();
  return c.json(mapRows(await db.select().from(schema.brands)));
});

app.get('/api/v1/brands/:id', async (c) => {
  const db = getDb();
  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, c.req.param('id')));
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  return c.json(toCamel(brand));
});

app.post('/api/v1/brands', async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomUUID().slice(0, 6);
  const [brand] = await db.insert(schema.brands).values({
    name: body.name,
    slug,
    description: body.description ?? null,
    tone_description: body.tone_description ?? null,
    consistency_threshold: body.consistency_threshold ?? 0.75,
    agency_id: body.agency_id ?? null,
  }).returning();
  return c.json(toCamel(brand), 201);
});

// ── Asset Upload (R2) + Auto-Generation ───────────────────────
app.post('/api/v1/brands/:brandId/assets', async (c) => {
  const brandId = c.req.param('brandId');
  const db = getDb();

  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
  if (!brand) return c.json({ error: 'Brand not found' }, 404);

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return c.json({ error: 'No file uploaded' }, 400);

  const assetId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const allowedExts = ['mp4', 'mov', 'png', 'jpg', 'jpeg', 'tiff', 'tif'];
  if (!allowedExts.includes(ext)) return c.json({ error: `Unsupported file type: .${ext}` }, 400);

  const mediaType = ['mp4', 'mov'].includes(ext) ? 'video' : 'image';
  const storageKey = `brands/${brandId}/assets/${assetId}.${ext}`;

  // Upload to R2
  const bucket = c.env.ASSETS_BUCKET;
  await bucket.put(storageKey, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { brandId, assetId, originalFilename: file.name },
  });

  // Create asset record
  const [asset] = await db.insert(schema.assets).values({
    id: assetId,
    brand_id: brandId,
    media_type: mediaType,
    original_filename: file.name,
    storage_key: storageKey,
    file_size_bytes: file.size,
    processing_status: 'uploaded',
  }).returning();

  // Auto-generate content if an LLM provider is available
  const { llm } = await resolveProviders();
  if (llm) {
    try {
      // Create a synthetic fragment (edge can't run FFmpeg, so the whole asset is one "fragment")
      const fragmentId = crypto.randomUUID();
      await db.insert(schema.fragments).values({
        id: fragmentId,
        asset_id: assetId,
        type: mediaType === 'video' ? 'clip' : 'crop',
        storage_key: storageKey,
        quality_score: 1.0,
        extraction_metadata: { source: 'edge-upload', synthetic: true },
      });

      await db.update(schema.assets)
        .set({ processing_status: 'extracted', fragment_count: 1 })
        .where(eq(schema.assets.id, assetId));

      const platforms = ['instagram_feed', 'instagram_reels', 'linkedin', 'x', 'tiktok'];
      const toneDesc = brand.tone_description || 'Professional and engaging';
      const brandDesc = brand.description || '';

      const platformGuide: Record<string, string> = {
        instagram_feed: 'Instagram Feed: visual-first, 3-5 hashtags, engaging but not cluttered, lifestyle tone',
        instagram_reels: 'Instagram Reels: hook in first line, high energy, 5-8 hashtags, trending feel',
        linkedin: 'LinkedIn: professional thought-leadership, value-add insight, 2-3 broad hashtags, structured with line breaks',
        x: 'X/Twitter: concise and punchy, max 280 chars, conversational, 1-2 hashtags max',
        tiktok: 'TikTok: informal, relatable, strong hook, trend-aware, minimal corporate speak',
      };

      for (const platform of platforms) {
        const prompt = `You are a social media expert for "${brand.name}"${brandDesc ? ` — ${brandDesc}` : ''}.
Brand voice: ${toneDesc}.
Platform: ${platformGuide[platform] || platform}.
Asset being promoted: "${file.name}" (${mediaType}).

Write a high-performing native post for this platform. Be specific, not generic.
Return ONLY valid JSON, no markdown: {"caption": "your full caption here", "hashtags": ["relevant", "tags"]}`;

        const response = await llm.generate(prompt, { maxTokens: 256 });
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        let parsed;
        try { parsed = JSON.parse(jsonMatch[0]); } catch { continue; }

        await db.insert(schema.contentUnits).values({
          id: crypto.randomUUID(),
          fragment_id: fragmentId,
          brand_id: brandId,
          platform,
          caption: parsed.caption || '',
          media_key: storageKey,
          media_type: mediaType,
          hashtags: parsed.hashtags || [],
          nc_score: 0,
          nc_score_breakdown: {},
          approval_status: 'pending',
          similarity_hash: crypto.randomUUID(),
        });
      }
    } catch (err) {
      console.error('Auto-generation failed:', err);
    }
  }

  // Return the updated asset with content count
  const [updatedAsset] = await db.select().from(schema.assets).where(eq(schema.assets.id, assetId));
  const contentCount = await db.select({ id: schema.contentUnits.id }).from(schema.contentUnits)
    .where(eq(schema.contentUnits.brand_id, brandId));
  const assetContent = contentCount.filter(() => true); // all content for brand

  return c.json({
    ...toCamel(updatedAsset || asset),
    contentGenerated: assetContent.length,
  }, 201);
});

// ── Asset List & Get ──────────────────────────────────────────
app.get('/api/v1/brands/:brandId/assets', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.assets)
    .where(eq(schema.assets.brand_id, c.req.param('brandId')))
    .orderBy(desc(schema.assets.created_at));
  return c.json(mapRows(rows));
});

app.get('/api/v1/brands/:brandId/assets/:assetId', async (c) => {
  const db = getDb();
  const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, c.req.param('assetId')));
  if (!asset) return c.json({ error: 'Asset not found' }, 404);
  return c.json(toCamel(asset));
});

// ── File Serving (R2) ─────────────────────────────────────────
app.get('/files/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const bucket = c.env.ASSETS_BUCKET;
  const object = await bucket.get(key);
  if (!object) return c.json({ error: 'File not found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
});

// ── Content ───────────────────────────────────────────────────
app.get('/api/v1/brands/:brandId/content', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.contentUnits)
    .where(eq(schema.contentUnits.brand_id, c.req.param('brandId')))
    .orderBy(desc(schema.contentUnits.created_at));
  return c.json(mapRows(rows));
});

app.post('/api/v1/brands/:brandId/content/:unitId/approve', async (c) => {
  const db = getDb();
  await db.update(schema.contentUnits)
    .set({ approval_status: 'approved' })
    .where(eq(schema.contentUnits.id, c.req.param('unitId')));
  return c.json({ status: 'approved' });
});

app.post('/api/v1/brands/:brandId/content/:unitId/reject', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const db = getDb();
  await db.update(schema.contentUnits)
    .set({ approval_status: 'rejected', flagged_reason: (body as { reason?: string }).reason ?? 'Manual rejection' })
    .where(eq(schema.contentUnits.id, c.req.param('unitId')));
  return c.json({ status: 'rejected' });
});

// ── Natural Center ────────────────────────────────────────────
app.get('/api/v1/brands/:brandId/natural-center', async (c) => {
  const db = getDb();
  const [nc] = await db.select().from(schema.naturalCenters)
    .where(eq(schema.naturalCenters.brand_id, c.req.param('brandId')));
  if (!nc) return c.json({ error: 'No identity profile derived yet' }, 404);
  return c.json(toCamel(nc));
});

// ── Fragments ─────────────────────────────────────────────────
app.get('/api/v1/brands/:brandId/assets/:assetId/fragments', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.fragments)
    .where(eq(schema.fragments.asset_id, c.req.param('assetId')));
  return c.json(mapRows(rows));
});

// ── Settings & Providers ──────────────────────────────────────
app.get('/api/v1/settings/providers', async (c) => {
  const providers = await resolveProviders();
  return c.json({
    llm: providers.llm
      ? { name: providers.llm.name, tier: providers.llm.tier, status: 'active' }
      : { name: 'none', status: 'not configured' },
    embedding: providers.embedding
      ? { name: providers.embedding.name, tier: providers.embedding.tier, status: 'active' }
      : { name: 'none', status: 'not configured' },
    transcription: providers.transcription
      ? { name: providers.transcription.name, tier: providers.transcription.tier, status: 'active' }
      : { name: 'none', status: 'not configured' },
    all: {
      llm: providers.allLLMs.map(p => ({ name: p.name, tier: p.tier })),
      embedding: providers.allEmbeddings.map(p => ({ name: p.name, tier: p.tier })),
      transcription: providers.allTranscriptions.map(p => ({ name: p.name, tier: p.tier })),
    },
  });
});

app.get('/api/v1/settings/keys', async (c) => {
  // In production, keys come from Worker secrets (process.env), not filesystem
  const env = process.env;
  return c.json({
    groq_api_key: env.GROQ_API_KEY ? `${env.GROQ_API_KEY.slice(0, 8)}...` : null, // allow-secret
    gemini_api_key: env.GEMINI_API_KEY ? `${env.GEMINI_API_KEY.slice(0, 8)}...` : null, // allow-secret
    cerebras_api_key: env.CEREBRAS_API_KEY ? `${env.CEREBRAS_API_KEY.slice(0, 8)}...` : null, // allow-secret
    anthropic_api_key: env.ANTHROPIC_API_KEY ? `${env.ANTHROPIC_API_KEY.slice(0, 10)}...` : null, // allow-secret
    openai_api_key: env.OPENAI_API_KEY ? `${env.OPENAI_API_KEY.slice(0, 7)}...` : null, // allow-secret
    cloudflare_account_id: env.CLOUDFLARE_ACCOUNT_ID ? `${env.CLOUDFLARE_ACCOUNT_ID.slice(0, 8)}...` : null,
    ollama_host: 'N/A (production — use cloud providers)',
  });
});

app.put('/api/v1/settings/keys', async (c) => {
  // In production, keys must be set as Worker secrets via wrangler CLI:
  // echo "key" | npx wrangler secret put GROQ_API_KEY -c apps/api/wrangler.toml
  return c.json({
    status: 'info',
    message: 'In production, API keys are set as Cloudflare Worker secrets. Use: echo "your-key" | npx wrangler secret put KEY_NAME -c apps/api/wrangler.toml',
    available_keys: ['GROQ_API_KEY', 'GEMINI_API_KEY', 'CEREBRAS_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
  });
});

// ── Billing ──────────────────────────────────────────────────
app.get('/api/v1/billing/status', (c) => {
  const env = process.env;
  const hasKey = !!env.STRIPE_SECRET_KEY;
  const hasWebhookSecret = !!env.STRIPE_WEBHOOK_SECRET;
  const hasCreatorPrice = !!env.STRIPE_PRICE_ID_CREATOR;
  const hasStudioPrice = !!env.STRIPE_PRICE_ID_STUDIO;
  return c.json({
    configured: hasKey && hasWebhookSecret && hasCreatorPrice && hasStudioPrice,
    stripe_key: hasKey,
    webhook_secret: hasWebhookSecret,
    price_creator: hasCreatorPrice,
    price_studio: hasStudioPrice,
  });
});

app.post('/api/v1/billing/checkout', async (c) => {
  const { default: Stripe } = await import('stripe');
  const body = await c.req.json();
  const tier = body.tier;
  const email = body.email;

  const validTiers = ['creator', 'studio'];
  if (!validTiers.includes(tier)) {
    return c.json({ error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` }, 400);
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return c.json({ error: 'STRIPE_SECRET_KEY not configured' }, 500);

  const stripe = new Stripe(key);
  const priceMap: Record<string, string | undefined> = {
    creator: process.env.STRIPE_PRICE_ID_CREATOR,
    studio: process.env.STRIPE_PRICE_ID_STUDIO,
  };
  const priceId = priceMap[tier];
  if (!priceId) return c.json({ error: `Price ID not configured for tier: ${tier}` }, 500);

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

  return c.json({ sessionId: session.id, url: session.url });
});

app.get('/api/v1/billing/session/:sessionId', async (c) => {
  const { default: Stripe } = await import('stripe');
  const sessionId = c.req.param('sessionId');
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return c.json({ error: 'STRIPE_SECRET_KEY not configured' }, 500);

  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  });

  return c.json({
    id: session.id,
    status: session.status,
    customerEmail: session.customer_details?.email,
    tier: session.metadata?.tier,
    subscriptionId: typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id,
  });
});

app.post('/api/v1/billing/webhook', async (c) => {
  const { default: Stripe } = await import('stripe');
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !webhookSecret) return c.json({ error: 'Stripe not configured' }, 500);

  const stripe = new Stripe(key);
  const signature = c.req.header('stripe-signature');
  if (!signature) return c.json({ error: 'Missing stripe-signature header' }, 400);

  const rawBody = await c.req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return c.json({ error: `Webhook verification failed: ${(err as Error).message}` }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Checkout completed:', { tier: session.metadata?.tier, email: session.customer_details?.email });
  }

  return c.json({ received: true });
});

// ── Asset ROI ─────────────────────────────────────────────────
app.get('/api/v1/brands/:brandId/roi', async (c) => {
  const db = getDb();
  const brandId = c.req.param('brandId');

  // Get all assets for brand
  const assets = await db.select().from(schema.assets)
    .where(eq(schema.assets.brand_id, brandId));

  const roi = await Promise.all(assets.map(async (asset) => {
    // Get content units for this asset's fragments
    const fragments = await db.select({ id: schema.fragments.id })
      .from(schema.fragments)
      .where(eq(schema.fragments.asset_id, asset.id));

    const fragmentIds = fragments.map(f => f.id);

    let contentCount = 0, approvedCount = 0;
    const platformSet = new Set<string>();
    let totalViews = 0, totalEngagement = 0;

    if (fragmentIds.length > 0) {
      const units = await db.select().from(schema.contentUnits)
        .where(inArray(schema.contentUnits.fragment_id, fragmentIds));

      contentCount = units.length;
      approvedCount = units.filter(u => u.approval_status === 'approved').length;
      units.forEach(u => { if (u.platform) platformSet.add(u.platform); });

      // Performance observations
      const unitIds = units.map(u => u.id);
      if (unitIds.length > 0) {
        const publishEvents = await db.select({ id: schema.publishEvents.id })
          .from(schema.publishEvents)
          .where(inArray(schema.publishEvents.content_unit_id, unitIds));

        if (publishEvents.length > 0) {
          const obs = await db.select().from(schema.performanceObservations)
            .where(inArray(schema.performanceObservations.publish_event_id, publishEvents.map(e => e.id)));
          totalViews = obs.reduce((s, o) => s + (o.views ?? 0), 0);
          totalEngagement = obs.reduce((s, o) => s + (o.likes ?? 0) + (o.comments ?? 0) + (o.shares ?? 0), 0);
        }
      }
    }

    return {
      assetId: asset.id,
      assetName: asset.original_filename,
      mediaType: asset.media_type,
      createdAt: asset.created_at,
      contentCount,
      approvedCount,
      platformCount: platformSet.size,
      totalViews,
      totalEngagement,
    };
  }));

  return c.json(roi);
});

// ── Natural Center Inquiries ───────────────────────────────────
app.post('/api/v1/brands/:brandId/natural-center/inquiries/:inquiryId/answer', async (c) => {
  const db = getDb();
  const brandId = c.req.param('brandId');
  const inquiryId = c.req.param('inquiryId');
  const body = await c.req.json();
  const answer = body.answer as string;

  const [nc] = await db.select().from(schema.naturalCenters)
    .where(eq(schema.naturalCenters.brand_id, brandId));

  if (!nc) return c.json({ error: 'No identity profile found' }, 404);

  // Update inquiry in JSONB array
  const inquiries = (nc.inquiries as Array<Record<string, unknown>>) || [];
  const updated = inquiries.map(inq =>
    inq.id === inquiryId ? { ...inq, answer, status: 'answered' } : inq
  );

  await db.update(schema.naturalCenters)
    .set({ inquiries: updated })
    .where(eq(schema.naturalCenters.brand_id, brandId));

  return c.json({ status: 'answered', inquiryId });
});

export default app;
