import { resolveProviders } from '@cronus/config';
import { NaturalCenter, IdentityInquiry } from '@cronus/domain';
import { randomUUID } from 'node:crypto';

/**
 * Generates clarification questions for low-confidence identity dimensions.
 */
export async function generateIdentityInquiries(nc: Partial<NaturalCenter>): Promise<IdentityInquiry[]> {
  const { llm } = await resolveProviders();
  if (!llm) return [];

  const lowConfidenceDimensions = Object.entries(nc.confidenceScores || {})
    .filter(([_, score]) => score < 0.6)
    .map(([dim]) => dim);

  if (lowConfidenceDimensions.length === 0) return [];

  const prompt = `
    The following brand identity profile has low confidence in these dimensions: ${lowConfidenceDimensions.join(', ')}.

    PROFILE SUMMARY:
    - Aesthetic: ${nc.aestheticSignature}
    - Tone: ${nc.tonalVector}

    Task: Generate 2-3 targeted multiple-choice questions to help refine these dimensions.

    RESPONSE FORMAT (JSON ARRAY):
    [
      {
        "question": "Which of these best describes your visual preference?",
        "options": ["High-energy and raw", "Polished and cinematic", "Minimalist and clean"],
        "dimension": "aesthetic"
      }
    ]
  `;

  const result = await llm.generate(prompt, { maxTokens: 1024 });

  let inquiries;
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    inquiries = JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }

  return (inquiries as Array<Partial<IdentityInquiry>>).map((iq) => ({
    ...iq,
    id: randomUUID(),
    status: 'pending' as const,
    createdAt: new Date(),
  })) as IdentityInquiry[];
}
