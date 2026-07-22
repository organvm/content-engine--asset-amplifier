/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateIdentityInquiries } from './inquiry.js';
import { resolveProviders } from '@cronus/config';

vi.mock('@cronus/config', () => ({
  resolveProviders: vi.fn(),
}));

describe('generateIdentityInquiries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty if no llm', async () => {
    vi.mocked(resolveProviders).mockResolvedValue({ llm: null } as any);
    const res = await generateIdentityInquiries({});
    expect(res).toEqual([]);
  });

  it('should return empty if confidence is high', async () => {
    vi.mocked(resolveProviders).mockResolvedValue({ llm: { generate: vi.fn() } } as any);
    const res = await generateIdentityInquiries({ confidenceScores: { visual: 0.9, tonal: 0.8 } as any });
    expect(res).toEqual([]);
  });

  it('should generate inquiries for low confidence dimensions', async () => {
    const mockLlm = {
      generate: vi.fn().mockResolvedValue('[{"question": "Q?", "options": ["A", "B"], "dimension": "visual"}]')
    };
    vi.mocked(resolveProviders).mockResolvedValue({ llm: mockLlm } as any);

    const res = await generateIdentityInquiries({
      confidenceScores: { visual: 0.4 } as any,
      aestheticSignature: 'a',
      tonalVector: 'b'
    });

    expect(res).toHaveLength(1);
    expect(res[0].question).toBe('Q?');
    expect(res[0].id).toBeDefined();
    expect(mockLlm.generate).toHaveBeenCalled();
  });
});
