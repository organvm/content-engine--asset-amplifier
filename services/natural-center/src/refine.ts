import { getDb, schema } from '@cronus/db';
import { eq, sql } from '@cronus/db';
import { NaturalCenter } from '@cronus/domain';
import { createLogger } from '@cronus/logger';
import { compileSystemPrompt } from './prompt.js';

const log = createLogger('natural-center:refine');

/**
 * Refines an existing Natural Center based on user adjustments.
 */
export async function refineNaturalCenter(params: {
  brandId: string;
  adjustments: Record<string, string>;
}) {
  const { brandId, adjustments } = params;
  const db = getDb();

  log.info({ brandId, adjustments }, 'Refining brand identity');

  // 1. Fetch current NC and Brand
  const [nc] = await db.select().from(schema.naturalCenters).where(eq(schema.naturalCenters.brand_id, brandId));
  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));

  if (!nc) throw new Error('No identity profile found to refine');

  // 2. Apply adjustments
  // For MVP, we directly merge adjustments into the text/json fields
  const updatedNc = {
    ...nc,
    tonal_vector: adjustments.tonal_vector || nc.tonal_vector,
    aesthetic_signature: adjustments.aesthetic_signature || nc.aesthetic_signature,
    narrative_bias: adjustments.narrative_bias || nc.narrative_bias,
  };

  // 3. Recompile system prompt
  const newSystemPrompt = compileSystemPrompt({
    brandName: brand.name,
    thematicCore: updatedNc.thematic_core as NaturalCenter['thematicCore'],
    aestheticSignature: updatedNc.aesthetic_signature as NaturalCenter['aestheticSignature'],
    tonalVector: updatedNc.tonal_vector as NaturalCenter['tonalVector'],
    narrativeBias: updatedNc.narrative_bias as NaturalCenter['narrativeBias'],
    symbolicMarkers: updatedNc.symbolic_markers as NaturalCenter['symbolicMarkers'],
    negativeSpace: updatedNc.negative_space as NaturalCenter['negativeSpace'],
  });

  // 4. Update Database
  await db.update(schema.naturalCenters)
    .set({
      ...updatedNc,
      system_prompt: newSystemPrompt,
      version: sql`${schema.naturalCenters.version} + 1`,
    })
    .where(eq(schema.naturalCenters.id, nc.id));

  log.info({ brandId, version: updatedNc.version + 1 }, 'Brand identity refined');
}
