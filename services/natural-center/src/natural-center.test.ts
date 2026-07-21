import { describe, it, expect } from 'vitest';
import { compileSystemPrompt, estimateNCConfidence } from './index.js';

describe('@cronus/natural-center compilation & confidence', () => {
  it('should compile structured Natural Center into system prompt string', () => {
    const prompt = compileSystemPrompt({
      brandName: 'Cronus Brand',
      aestheticSignature: 'Minimalist glassmorphism',
      tonalVector: 'Technical and sovereign',
      narrativeBias: 'Usable instruments',
      symbolicMarkers: ['precision', 'clarity'],
      negativeSpace: ['generic marketing', 'cluttered design'],
    });

    expect(prompt).toContain('# ROLE');
    expect(prompt).toContain('Cronus Brand');
    expect(prompt).toContain('Minimalist glassmorphism');
    expect(prompt).toContain('Technical and sovereign');
    expect(prompt).toContain('- generic marketing');
  });

  it('should estimate NC confidence based on input asset signal density', () => {
    const confidence = estimateNCConfidence({
      assetCount: 5,
      hasGuidelines: true,
      signalConsistency: 0.9,
    });

    expect(confidence.overall).toBeGreaterThan(0.7);
    expect(confidence.usable).toBe(true);
    expect(confidence.scores.tonal).toBe(0.85);
  });

  it('should flag low confidence profiles as not usable', () => {
    const confidence = estimateNCConfidence({
      assetCount: 0,
      hasGuidelines: false,
      signalConsistency: 0.2,
    });

    expect(confidence.overall).toBeLessThan(0.5);
    expect(confidence.usable).toBe(false);
  });
});
