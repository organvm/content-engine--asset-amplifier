import { resolveProviders } from '@cronus/config';
import { getDb, schema } from '@cronus/db';
import { eq, inArray } from '@cronus/db';
import { ApprovalStatus } from '@cronus/domain';
import { createLogger } from '@cronus/logger';

const log = createLogger('scoring');

/**
 * Computes brand alignment scores for a batch of content units.
 * 
 * 1. Loads the brand's Natural Center (NC) embedding.
 * 2. For each unit, generates an embedding for its caption.
 * 3. Calculates cosine similarity between unit and brand embeddings.
 * 4. Updates ContentUnit with score and flags for review if below threshold.
 */
export async function scoreContentUnits(contentUnitIds: string[]) {
  const db = getDb();
  const { embedding } = await resolveProviders();

  if (!embedding) {
    log.warn('No embedding provider available, skipping scoring');
    return;
  }

  // 1. Fetch content units
  const units = await db
    .select()
    .from(schema.contentUnits)
    .where(inArray(schema.contentUnits.id, contentUnitIds));

  if (units.length === 0) return;

  const brandId = units[0].brand_id;
  
  // 2. Load Brand and NC
  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
  const [nc] = await db.select().from(schema.naturalCenters).where(eq(schema.naturalCenters.brand_id, brandId));

  if (!nc) {
    log.warn({ brandId }, 'No Natural Center found for brand, cannot score alignment');
    return;
  }

  // Brand embedding is stored as pgvector; Drizzle returns number[] directly
  const brandEmbedding: number[] = Array.isArray(nc.brand_embedding)
    ? (nc.brand_embedding as number[])
    : typeof nc.brand_embedding === 'string'
      ? JSON.parse(nc.brand_embedding as string)
      : [];

  log.info({ brandId, unitCount: units.length }, 'Scoring content batch');

  for (const unit of units) {
    try {
      // 3. Generate Unit Embedding
      const unitEmbedding = await embedding.embed(unit.caption);

      // 4. Calculate Cosine Similarity
      const score = calculateCosineSimilarity(unitEmbedding, brandEmbedding);

      // 5. Apply thresholds and update
      const threshold = brand.consistency_threshold ?? 0.75;
      const isLowScore = score < threshold;
      
      await db.update(schema.contentUnits)
        .set({ 
          nc_score: score,
          nc_score_breakdown: { 
            thematic: score, // MVP simplification: thematic is primary
            overall: score 
          },
          approval_status: isLowScore ? ApprovalStatus.flagged : unit.approval_status,
          flagged_reason: isLowScore ? `Alignment score (${score.toFixed(2)}) below brand threshold (${threshold})` : null,
        })
        .where(eq(schema.contentUnits.id, unit.id));

      log.debug({ unitId: unit.id, score }, 'Unit scored');

    } catch (err) {
      log.error({ err, unitId: unit.id }, 'Failed to score unit');
    }
  }

  log.info({ brandId }, 'Scoring batch complete');
}

/**
 * Calculates cosine similarity between two numeric vectors.
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}
