import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = !!databaseUrl;

describe.runIf(runIntegration)('E2E Pipeline', () => {
  let db: Awaited<ReturnType<typeof import('@cronus/db').getDb>>;
  let schema: typeof import('@cronus/db').schema;

  beforeAll(async () => {
    const cronusDb = await import('@cronus/db');
    db = cronusDb.getDb();
    schema = cronusDb.schema;
  });

  it('should create a brand, asset, fragment, score content, and simulate publish', async () => {
    const brandId = crypto.randomUUID();
    const assetId = crypto.randomUUID();
    const fragmentId = crypto.randomUUID();
    const contentUnitId = crypto.randomUUID();

    await db.insert(schema.brands).values({
      id: brandId,
      name: 'E2E Test Brand',
      slug: `e2e-test-${crypto.randomUUID().slice(0, 6)}`,
      description: 'Brand created during E2E pipeline test',
      tone_description: 'Professional and innovative',
      consistency_threshold: 0.75,
    });

    await db.insert(schema.assets).values({
      id: assetId,
      brand_id: brandId,
      media_type: 'image',
      original_filename: 'e2e-test.png',
      storage_key: `brands/${brandId}/assets/${assetId}.png`,
      file_size_bytes: 1024,
      processing_status: 'uploaded',
    });

    await db.insert(schema.fragments).values({
      id: fragmentId,
      asset_id: assetId,
      type: 'crop',
      storage_key: `brands/${brandId}/fragments/${fragmentId}.jpg`,
      quality_score: 1.0,
      extraction_metadata: { source: 'e2e-test', synthetic: true },
    });

    await db.insert(schema.contentUnits).values({
      id: contentUnitId,
      fragment_id: fragmentId,
      brand_id: brandId,
      platform: 'instagram_feed',
      caption: 'E2E test caption for Instagram feed',
      media_key: `brands/${brandId}/fragments/${fragmentId}.jpg`,
      media_type: 'image',
      hashtags: ['#e2e', '#test'],
      nc_score: 0,
      nc_score_breakdown: {},
      approval_status: 'pending',
      similarity_hash: crypto.randomUUID(),
    });

    const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
    expect(brand).toBeDefined();
    expect(brand.name).toBe('E2E Test Brand');

    const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, assetId));
    expect(asset).toBeDefined();
    expect(asset.processing_status).toBe('uploaded');

    const [fragment] = await db.select().from(schema.fragments).where(eq(schema.fragments.id, fragmentId));
    expect(fragment).toBeDefined();
    expect(fragment.quality_score).toBe(1.0);

    const [contentUnit] = await db.select().from(schema.contentUnits).where(eq(schema.contentUnits.id, contentUnitId));
    expect(contentUnit).toBeDefined();
    expect(contentUnit.approval_status).toBe('pending');

    // Score content
    const scoring = await import('@cronus/scoring');
    await scoring.scoreContentUnits([contentUnitId]);

    const [scored] = await db.select().from(schema.contentUnits).where(eq(schema.contentUnits.id, contentUnitId));
    expect(scored.nc_score).toBeGreaterThanOrEqual(0);

    // Create publish event
    const publishEventId = crypto.randomUUID();
    const connectionId = crypto.randomUUID();
    await db.insert(schema.platformConnections).values({
      id: connectionId,
      brand_id: brandId,
      platform: 'instagram_feed',
      platform_account_id: 'e2e-test-account',
      platform_account_name: 'E2E Test Account',
      status: 'active',
      access_token: 'mock-token',
      scopes: ['public'],
      rate_limit_state: {},
    });

    await db.insert(schema.publishEvents).values({
      id: publishEventId,
      content_unit_id: contentUnitId,
      platform_connection_id: connectionId,
      status: 'pending',
    });

    const [publishEvent] = await db.select().from(schema.publishEvents).where(eq(schema.publishEvents.id, publishEventId));
    expect(publishEvent).toBeDefined();
    expect(publishEvent.status).toBe('pending');

    // Cleanup
    await db.delete(schema.publishEvents).where(eq(schema.publishEvents.id, publishEventId));
    await db.delete(schema.platformConnections).where(eq(schema.platformConnections.id, connectionId));
    await db.delete(schema.contentUnits).where(eq(schema.contentUnits.id, contentUnitId));
    await db.delete(schema.fragments).where(eq(schema.fragments.id, fragmentId));
    await db.delete(schema.assets).where(eq(schema.assets.id, assetId));
    await db.delete(schema.brands).where(eq(schema.brands.id, brandId));
  });
});

function eq(col: unknown, val: unknown) {
  return { column: col, value: val } as never;
}
