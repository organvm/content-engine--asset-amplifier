import { fileURLToPath } from 'node:url';
import { getDb } from './client.js';
import { schema } from './schema/index.js';

/**
 * Seeds the database with default agency, brand, asset, content unit,
 * natural center, and platform connection data for local development.
 */
export async function seedDatabase() {
  const db = getDb();
  console.log('Seeding database with default Cronus Metabolus dataset...');

  try {
    // 1. Seed Agency
    const agencyId = '00000000-0000-0000-0000-000000000001';
    await db
      .insert(schema.agencies)
      .values({
        id: agencyId,
        name: 'Padavano & Lefler Design',
        slug: 'padavano-lefler',
        contact_email: 'hello@organvm.org',
        primary_color: '#6366f1',
      })
      .onConflictDoNothing();

    // 2. Seed Brand
    const brandId = '00000000-0000-0000-0000-000000000002';
    await db
      .insert(schema.brands)
      .values({
        id: brandId,
        agency_id: agencyId,
        name: 'Cronus Brand',
        slug: 'cronus-brand',
        description: 'AI-powered content metabolism engine and media instruments.',
        tone_description: 'Intellectual, crisp, sovereign, and platform-native.',
        consistency_threshold: 0.75,
        status: 'active',
      })
      .onConflictDoNothing();

    // 3. Seed Natural Center
    const ncId = '00000000-0000-0000-0000-000000000003';
    await db
      .insert(schema.naturalCenters)
      .values({
        id: ncId,
        brand_id: brandId,
        version: 1,
        thematic_core: { primary: 'Autonomous Content Metabolism', secondary: 'Sparse Visual Staging' },
        aesthetic_signature: 'High-contrast dark mode, glassmorphism, geometric precision.',
        tonal_vector: 'Crisp, authoritative, technical, and concise.',
        narrative_bias: 'Methodology made visible through usable instruments.',
        symbolic_markers: ['precision', 'sovereignty', 'computable-identity'],
        negative_space: ['generic-marketing', 'cluttered-layouts', 'corporate-speak'],
        brand_embedding: Array(1536).fill(0.01),
        confidence_scores: { thematic: 0.85, aesthetic: 0.9, tonal: 0.8, narrative: 0.75 },
        overall_confidence: 0.825,
        source_asset_ids: [],
        system_prompt: 'You are the Cronus content engine. Author crisp, sovereign posts.',
        inquiries: [
          {
            id: 'inq-1',
            question: 'How should technical depth be balanced against visual abstraction in hero clips?',
            options: ['Focus on code clarity', 'Emphasize visual aesthetics', 'Equal weight'],
            dimension: 'aesthetic',
            status: 'pending',
            createdAt: new Date(),
          },
        ],
      })
      .onConflictDoNothing();

    // 4. Seed Platform Connection
    const connectionId = '00000000-0000-0000-0000-000000000004';
    await db
      .insert(schema.platformConnections)
      .values({
        id: connectionId,
        brand_id: brandId,
        platform: 'instagram_feed',
        platform_account_id: 'cronus_official',
        platform_account_name: 'Cronus Official',
        access_token: 'mock-encrypted-token',
        status: 'active',
        scopes: ['instagram_basic', 'instagram_content_publish'],
      })
      .onConflictDoNothing();

    console.log('Database seeding completed successfully:', { agencyId, brandId, ncId });
    return { agencyId, brandId, ncId };
  } catch (err) {
    console.error('Database seeding failed:', err);
    throw err;
  }
}

// Run directly (e.g. `tsx packages/db/src/seed.ts` / `pnpm db:seed`), not on import.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
