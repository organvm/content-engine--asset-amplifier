import { describe, it, expect, vi } from 'vitest';
import { processNcDerive } from './nc-derive.js';
import { deriveNaturalCenter } from '@cronus/natural-center';
import { JobPayloads } from '@cronus/queue';

vi.mock('@cronus/natural-center', () => ({
  deriveNaturalCenter: vi.fn(),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('nc-derive processor', () => {
  it('should derive natural center with correct parameters', async () => {
    const data: JobPayloads['nc.derive'] = {
      brandId: 'brand-123',
      assetIds: ['asset-1', 'asset-2'],
      toneDescription: 'professional',
    };

    await processNcDerive(data);

    expect(deriveNaturalCenter).toHaveBeenCalledWith({
      brandId: 'brand-123',
      assetIds: ['asset-1', 'asset-2'],
      toneDescription: 'professional',
    });
  });
});
