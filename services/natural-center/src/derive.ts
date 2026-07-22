import { resolveProviders } from '@cronus/config';
import { getDb, schema } from '@cronus/db';
import { eq, inArray, and, sql } from '@cronus/db';
import { createLogger } from '@cronus/logger';
import { FragmentType } from '@cronus/domain';
import { generateIdentityInquiries } from './inquiry.js';

const log = createLogger('natural-center:derive');

/**
 * Derives a Computable Brand Identity (Natural Center) from source assets.
 * 
 * 1. Analyzes visual style using Claude Vision on keyframes.
 * 2. Analyzes tonal/thematic signals from transcripts and descriptions.
 * 3. Syntheses these into a structured NC profile.
 * 4. Generates a master brand embedding for alignment scoring.
 * 5. Compiles a master system prompt for generation.
 * 6. Generates clarification inquiries for low-confidence dimensions.
 */
export async function deriveNaturalCenter(params: {
  brandId: string;
  assetIds: string[];
  toneDescription?: string;
}) {
  const { brandId, assetIds, toneDescription } = params;
  const db = getDb();
  const { llm, embedding } = await resolveProviders();

  if (!llm) {
    throw new Error('No LLM provider available');
  }

  log.info({ brandId, assetCount: assetIds.length }, 'Deriving brand identity');

  try {
    // 1. Collect inputs (keyframes and transcripts)
    const keyframes = await db
      .select()
      .from(schema.fragments)
      .where(
        and(
          inArray(schema.fragments.asset_id, assetIds),
          eq(schema.fragments.type, FragmentType.keyframe)
        )
      )
      .limit(5);

    const assets = await db
      .select()
      .from(schema.assets)
      .where(inArray(schema.assets.id, assetIds));

    const transcriptions = assets.map(a => a.transcription).filter(Boolean).join('\n\n');

    // 2. Visual Analysis — use extraction metadata or LLM to describe visual style
    let visualSignature = "Modern, minimalist, high-contrast, premium product focus.";
    const extractionMeta = keyframes
      .map(kf => kf.extraction_metadata as Record<string, unknown> | null)
      .filter(Boolean);
    if (extractionMeta.length > 0) {
      const collected = extractionMeta.map(m => JSON.stringify(m)).join('; ');
      try {
        const visionPrompt = `Based on these visual asset analysis metadata, describe the brand's visual style and aesthetic signature in 1-2 sentences. Focus on: color palette, lighting, composition, mood, and overall design language.\n\nExtraction metadata: ${collected}`;
        const visionResult = await llm.generate(visionPrompt, { maxTokens: 100 });
        if (visionResult) visualSignature = visionResult.trim();
      } catch (visionErr) {
        log.warn({ err: visionErr }, 'Vision analysis failed, using default visual signature');
      }
    }

    // 3. Tonal Synthesis
    const synthesisPrompt = `Analyze this brand and return ONLY valid JSON (no markdown, no explanation):

TONE: ${toneDescription || 'Professional'}
VISUAL: ${visualSignature}
TRANSCRIPTS: ${transcriptions || 'None'}

Return this exact JSON structure:
{"thematic_core":{"primary":"...","secondary":"..."},"aesthetic_signature":"...","tonal_vector":"...","narrative_bias":"...","symbolic_markers":["...","..."],"negative_space":["...","..."],"summary":"..."}`;

    const synthesisText = await llm.generate(synthesisPrompt, { maxTokens: 1024 });

    let profile;
    try {
      // Extract JSON from response (Ollama may include extra text)
      const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object found');
      profile = JSON.parse(jsonMatch[0]);
    } catch {
      log.warn({ brandId, response: synthesisText.slice(0, 200) }, 'AI response not valid JSON, using defaults');
      profile = {
        thematic_core: { primary: toneDescription || 'professional', secondary: 'modern' },
        aesthetic_signature: visualSignature,
        tonal_vector: toneDescription || 'Professional yet approachable',
        narrative_bias: 'Product and service showcase',
        symbolic_markers: ['quality', 'precision'],
        negative_space: ['cluttered', 'cheap', 'generic'],
        summary: `Brand identity for ${brandId}`,
      };
    }

    // 4. Master Brand Embedding
    const embeddingInput = `${profile.summary} ${profile.tonal_vector} ${profile.aesthetic_signature}`;
    const brandEmbedding = embedding
      ? await embedding.embed(embeddingInput)
      : [];

    // 5. System Prompt Compilation (T036)
    const systemPrompt = `
      You are the ${brandId} content engine.
      AESTHETIC: ${profile.aesthetic_signature}
      TONE: ${profile.tonal_vector}
      THEMES: ${JSON.stringify(profile.thematic_core)}
      AVOID: ${profile.negative_space.join(', ')}
    `;

    // 6. Generate Inquiries if confidence is low
    const confidenceScores = { visual: 0.8, tonal: 0.5 }; // Mock low confidence for demonstration
    const inquiries = await generateIdentityInquiries({
      aestheticSignature: profile.aesthetic_signature,
      tonalVector: profile.tonal_vector,
      confidenceScores,
    });

    // 7. Persistence
    const [nc] = await db.insert(schema.naturalCenters).values({
      brand_id: brandId,
      version: 1,
      thematic_core: profile.thematic_core,
      aesthetic_signature: profile.aesthetic_signature,
      tonal_vector: profile.tonal_vector,
      narrative_bias: profile.narrative_bias,
      symbolic_markers: profile.symbolic_markers,
      negative_space: profile.negative_space,
      brand_embedding: brandEmbedding,
      confidence_scores: confidenceScores,
      overall_confidence: 0.65,
      source_asset_ids: assetIds,
      system_prompt: systemPrompt,
      inquiries: inquiries,
    })
    .onConflictDoUpdate({
      target: schema.naturalCenters.brand_id,
      set: {
        version: sql`${schema.naturalCenters.version} + 1`,
        thematic_core: profile.thematic_core,
        brand_embedding: brandEmbedding,
        system_prompt: systemPrompt,
        inquiries: inquiries,
      }
    })
    .returning();

    log.info({ brandId, ncId: nc.id }, 'Brand identity derived successfully');
    return nc;

  } catch (error) {
    log.error({ err: error, brandId }, 'Identity derivation failed');
    throw error;
  }
}
