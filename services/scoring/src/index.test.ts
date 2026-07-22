/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scoreContentUnits, calculateCosineSimilarity, querySimilarNaturalCenters } from './index.js';
import { getDb } from '@cronus/db';
import { resolveProviders } from '@cronus/config';
import { ApprovalStatus } from '@cronus/domain';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: {
    contentUnits: { id: 'contentUnits', brand_id: 'brand_id' },
    brands: { id: 'brands' },
    naturalCenters: { id: 'naturalCenters', brand_id: 'brand_id' }
  },
  eq: vi.fn(),
  inArray: vi.fn(),
  sql: vi.fn((strings, ...values) => ({ strings, values })),
}));

vi.mock('@cronus/config', () => ({
  resolveProviders: vi.fn(),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('scoring index', () => {
  describe('calculateCosineSimilarity', () => {
    it('returns 0 for mismatched lengths or empty vectors', () => {
      expect(calculateCosineSimilarity([], [])).toBe(0);
      expect(calculateCosineSimilarity([1], [1, 2])).toBe(0);
    });

    it('calculates cosine similarity correctly', () => {
      expect(calculateCosineSimilarity([1, 0], [1, 0])).toBe(1);
      expect(calculateCosineSimilarity([1, 0], [0, 1])).toBe(0);
      expect(calculateCosineSimilarity([1, 1], [1, 1]).toFixed(4)).toBe('1.0000');
    });
  });

  describe('scoreContentUnits', () => {
    let dbMock: any;
    let embeddingMock: any;

    beforeEach(() => {
      vi.clearAllMocks();

      dbMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };
      (getDb as any).mockReturnValue(dbMock);

      embeddingMock = {
        embed: vi.fn().mockResolvedValue([0.1, 0.2]),
      };
      (resolveProviders as any).mockResolvedValue({ embedding: embeddingMock });
    });

    it('should skip if no embedding provider is available', async () => {
      (resolveProviders as any).mockResolvedValue({ embedding: null });
      await scoreContentUnits(['unit-1']);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    it('should skip if no units are found', async () => {
      dbMock.where.mockResolvedValueOnce([]); // contentUnits
      await scoreContentUnits(['unit-1']);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    it('should score units and update db', async () => {
      const mockUnits = [{ id: 'unit-1', brand_id: 'brand-1', caption: 'hello', approval_status: ApprovalStatus.pending }];
      const mockBrands = [{ id: 'brand-1', consistency_threshold: 0.8 }];
      const mockNc = [{ brand_id: 'brand-1', brand_embedding: [0.1, 0.2] }];

      dbMock.where
        .mockResolvedValueOnce(mockUnits) // units
        .mockResolvedValueOnce(mockBrands) // brands
        .mockResolvedValueOnce(mockNc); // natural center

      dbMock.set.mockReturnThis();
      dbMock.where.mockResolvedValueOnce({}); // update where

      await scoreContentUnits(['unit-1']);

      expect(embeddingMock.embed).toHaveBeenCalledWith('hello');
      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith(expect.objectContaining({
        nc_score: expect.any(Number),
        approval_status: ApprovalStatus.pending // Since 1.0 >= 0.8, should remain same status
      }));
    });
    
    it('should flag if score is below threshold', async () => {
      const mockUnits = [{ id: 'unit-1', brand_id: 'brand-1', caption: 'hello', approval_status: ApprovalStatus.pending }];
      const mockBrands = [{ id: 'brand-1', consistency_threshold: 0.8 }];
      const mockNc = [{ brand_id: 'brand-1', brand_embedding: [-0.1, -0.2] }]; // opposite embedding to get low score

      dbMock.where
        .mockResolvedValueOnce(mockUnits)
        .mockResolvedValueOnce(mockBrands)
        .mockResolvedValueOnce(mockNc);

      dbMock.set.mockReturnThis();
      dbMock.where.mockResolvedValueOnce({});

      await scoreContentUnits(['unit-1']);

      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith(expect.objectContaining({
        approval_status: ApprovalStatus.flagged
      }));
    });
  });
  
  describe('querySimilarNaturalCenters', () => {
    let dbMock: any;
    
    beforeEach(() => {
      vi.clearAllMocks();
      dbMock = {
        execute: vi.fn(),
      };
      (getDb as any).mockReturnValue(dbMock);
    });
    
    it('should return mapped results from pgvector query', async () => {
      dbMock.execute.mockResolvedValue([{
        id: 'nc-1',
        brand_id: 'brand-1',
        version: 2,
        similarity: 0.95
      }]);
      
      const results = await querySimilarNaturalCenters([0.1, 0.2]);
      
      expect(results).toEqual([{
        id: 'nc-1',
        brandId: 'brand-1',
        version: 2,
        similarity: 0.95
      }]);
    });
    
    it('should handle query execution error', async () => {
      dbMock.execute.mockRejectedValue(new Error('db error'));
      const results = await querySimilarNaturalCenters([0.1, 0.2]);
      expect(results).toEqual([]);
    });
  });
});
