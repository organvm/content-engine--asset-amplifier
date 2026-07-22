/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processContentGenerate } from './content-generate.js';
import { generateAssetContent, deduplicateContentUnits } from '@cronus/content-generation';
import { scoreContentUnits } from '@cronus/scoring';
import { getDb } from '@cronus/db';
import { JobPayloads } from '@cronus/queue';
import { Platform } from '@cronus/domain';

vi.mock('@cronus/content-generation', () => ({
  generateAssetContent: vi.fn(),
  deduplicateContentUnits: vi.fn(),
}));

vi.mock('@cronus/scoring', () => ({
  scoreContentUnits: vi.fn(),
}));

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: {
    fragments: { id: 'fragmentId', asset_id: 'asset_id' },
    contentUnits: { id: 'unitId', brand_id: 'brand_id' },
  },
  eq: vi.fn(),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('content-generate processor', () => {
  let mockDb: any;
  let mockSelect: any;
  let mockFrom: any;
  let mockWhere: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere = vi.fn().mockResolvedValue([]);
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb = { select: mockSelect };
    (getDb as any).mockReturnValue(mockDb);
  });

  it('should generate content and skip scoring/deduplication if no fragments are found', async () => {
    const data: JobPayloads['content.generate'] = {
      brandId: 'brand-123',
      assetId: 'asset-456',
      platforms: [Platform.x],
      postsPerFragment: 1,
    };

    // No fragments returned
    mockWhere.mockResolvedValueOnce([]);

    await processContentGenerate(data);

    expect(generateAssetContent).toHaveBeenCalledWith({
      brandId: 'brand-123',
      assetId: 'asset-456',
      platforms: [Platform.x],
    });
    expect(scoreContentUnits).not.toHaveBeenCalled();
    expect(deduplicateContentUnits).not.toHaveBeenCalled();
  });

  it('should generate content and score/deduplicate if fragments and units are found', async () => {
    const data: JobPayloads['content.generate'] = {
      brandId: 'brand-123',
      assetId: 'asset-456',
      platforms: [Platform.x],
      postsPerFragment: 1,
    };

    // Fragments query
    mockWhere.mockResolvedValueOnce([{ id: 'frag-1' }]);
    // Units query
    mockWhere.mockResolvedValueOnce([{ id: 'unit-1' }, { id: 'unit-2' }]);

    await processContentGenerate(data);

    expect(generateAssetContent).toHaveBeenCalledWith({
      brandId: 'brand-123',
      assetId: 'asset-456',
      platforms: [Platform.x],
    });
    expect(scoreContentUnits).toHaveBeenCalledWith(['unit-1', 'unit-2']);
    expect(deduplicateContentUnits).toHaveBeenCalledWith('brand-123', ['unit-1', 'unit-2']);
  });
});
