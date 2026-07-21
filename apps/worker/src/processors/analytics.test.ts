import { describe, it, expect, vi } from 'vitest';
import { processAnalyticsCollect } from './analytics.js';
import { collectMetrics } from '@cronus/analytics';
import { JobPayloads } from '@cronus/queue';

vi.mock('@cronus/analytics', () => ({
  collectMetrics: vi.fn(),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('analytics processor', () => {
  it('should process analytics collect job', async () => {
    const data: JobPayloads['analytics.collect'] = {
      brandId: 'brand-123',
    };

    await processAnalyticsCollect(data);

    expect(collectMetrics).toHaveBeenCalledWith('brand-123');
  });
});
