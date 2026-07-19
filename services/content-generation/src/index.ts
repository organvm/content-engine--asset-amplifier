import { resolveProviders } from '@cronus/config';
import { getDb, schema } from '@cronus/db';
import { eq } from '@cronus/db';
import { Platform, FragmentType, ApprovalStatus } from '@cronus/domain';
import { createLogger } from '@cronus/logger';
import { constructUserPrompt, getBaseSystemPrompt } from './prompts.js';
import { formatMedia } from './formatter.js';
import { randomUUID } from 'node:crypto';

export { deduplicateContentUnits } from './dedup.js';

const log = createLogger('content-generation');

/**
 * Generates platform-native content units for an asset's fragments.
 *
 * 1. Loads brand context and Natural Center (if exists).
 * 2. Iterates through visual fragments (clips, keyframes, crops).
 * 3. Calls the resolved LLM provider to generate captions and hashtags per platform.
 * 4. Formats media for the target platform.
 * 5. Saves ContentUnit records for review.
 */
export async function generateAssetContent(params: {
  brandId: string;
  assetId: string;
  platforms: Platform[];
}) {
  const { brandId, assetId, platforms } = params;
  const db = getDb();
  const { llm } = await resolveProviders();

  if (!llm) {
    log.warn('No LLM provider available — skipping content generation');
    return;
  }

  // 1. Load context
  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
  if (!brand) throw new Error('Brand not found');

  const [nc] = await db.select().from(schema.naturalCenters).where(eq(schema.naturalCenters.brand_id, brandId));

  const fragments = await db.select().from(schema.fragments).where(eq(schema.fragments.asset_id, assetId));

  log.info({ brandId, assetId, fragmentCount: fragments.length }, 'Starting batch content generation');

  for (const fragment of fragments) {
    // Skip non-visual fragments for primary content units
    if (fragment.type === FragmentType.audio_segment) continue;

    for (const platform of platforms) {
      try {
        log.debug({ fragmentId: fragment.id, platform }, 'Generating unit');

        // 2. AI Caption Generation
        const systemPrompt = getBaseSystemPrompt({
          brandName: brand.name,
          platform,
          brandDescription: brand.description || undefined,
          toneDescription: brand.tone_description || undefined,
          systemPrompt: nc?.system_prompt || undefined
        });
        
        const userPrompt = constructUserPrompt({
          brandName: brand.name,
          platform,
          fragmentDescription: fragment.description || undefined,
          // TODO: link transcript hook if it matches this fragment's timestamp
        });

        const responseText = await llm.generate(userPrompt, {
          system: systemPrompt,
          maxTokens: 1024,
        });

        let aiOutput;
        try {
          // Extract JSON from response (LLM may include markdown or explanation)
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON found');
          aiOutput = JSON.parse(jsonMatch[0]);
        } catch {
          log.warn({ fragmentId: fragment.id, platform }, 'Failed to parse AI response, skipping');
          continue;
        }

        // 3. Media Formatting
        const mediaType = fragment.type === FragmentType.clip ? 'video' : 'image';
        const mediaKey = await formatMedia({
          brandId,
          platform,
          storageKey: fragment.storage_key,
          mediaType
        });

        // 4. Persistence
        await db.insert(schema.contentUnits).values({
          id: randomUUID(),
          fragment_id: fragment.id,
          brand_id: brandId,
          platform,
          caption: aiOutput.caption,
          hashtags: aiOutput.hashtags || [],
          media_key: mediaKey,
          media_type: mediaType,
          nc_score: 0, // Scored in T029
          nc_score_breakdown: {},
          approval_status: ApprovalStatus.pending,
          similarity_hash: randomUUID(), // Computed in T030
        });

      } catch (err) {
        log.error({ err, fragmentId: fragment.id, platform }, 'Failed to generate content unit');
        // Continue to next unit even if one fails
      }
    }
  }

  log.info({ assetId }, 'Content generation batch complete');
}
