import { describe, it, expect } from 'vitest';
import { constructUserPrompt, getBaseSystemPrompt, PromptContext } from './prompts.js';
import { Platform } from '@cronus/domain';

describe('prompts', () => {
  const baseCtx: PromptContext = {
    brandName: 'Test Brand',
    platform: Platform.instagram_feed,
  };

  describe('constructUserPrompt', () => {
    it('should construct prompt with default fragment description', () => {
      const prompt = constructUserPrompt(baseCtx);
      expect(prompt).toContain('Test Brand');
      expect(prompt).toContain(Platform.instagram_feed);
      expect(prompt).toContain('A visual segment from a brand asset.');
      expect(prompt).toContain('Visually descriptive');
    });

    it('should include specific fragment description and transcript hook', () => {
      const prompt = constructUserPrompt({
        ...baseCtx,
        fragmentDescription: 'A specific video fragment.',
        transcriptHook: 'Buy now!'
      });
      expect(prompt).toContain('A specific video fragment.');
      expect(prompt).toContain('Key Quote/Hook: "Buy now!"');
    });
  });

  describe('getBaseSystemPrompt', () => {
    it('should return systemPrompt if provided', () => {
      expect(getBaseSystemPrompt({ ...baseCtx, systemPrompt: 'Custom System Prompt' })).toBe('Custom System Prompt');
    });

    it('should construct base system prompt if systemPrompt is absent', () => {
      const prompt = getBaseSystemPrompt({
        ...baseCtx,
        toneDescription: 'Friendly',
        brandDescription: 'To be the best'
      });
      expect(prompt).toContain('expert social media manager for Test Brand');
      expect(prompt).toContain('TONE: Friendly');
      expect(prompt).toContain('BRAND MISSION: To be the best');
    });
  });
});
