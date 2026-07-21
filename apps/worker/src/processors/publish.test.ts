import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executePublish } from './publish.js';
import { getDb } from '@cronus/db';
import { getAdapter } from '@cronus/platform-adapter';
import { JobPayloads } from '@cronus/queue';

vi.mock('@cronus/db', () => ({
  getDb: vi.fn(),
  schema: {
    publishEvents: { id: 'eventId' },
    contentUnits: { id: 'unitId' },
    platformConnections: { id: 'connId' },
  },
  eq: vi.fn(),
}));

vi.mock('@cronus/platform-adapter', () => ({
  getAdapter: vi.fn(),
}));

vi.mock('@cronus/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('publish processor', () => {
  let mockDb: any;
  let mockWhere: any;
  let mockFrom: any;
  let mockSelect: any;
  let mockUpdate: any;
  let mockSet: any;
  let mockPublish: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere = vi.fn().mockResolvedValue([]);
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
    mockDb = { select: mockSelect, update: mockUpdate };
    (getDb as any).mockReturnValue(mockDb);

    mockPublish = vi.fn().mockResolvedValue({ platformPostId: 'post-123', platformPostUrl: 'https://post.url' });
    (getAdapter as any).mockReturnValue({ publish: mockPublish });
  });

  it('should throw an error if the publish event is not found', async () => {
    const data: JobPayloads['publish.execute'] = { publishEventId: 'event-1' };
    mockWhere.mockResolvedValueOnce([]); // No event found

    await expect(executePublish(data)).rejects.toThrow('Publish event not found: event-1');
  });

  it('should successfully execute a publish event', async () => {
    const data: JobPayloads['publish.execute'] = { publishEventId: 'event-1' };
    
    // Mock event
    mockWhere.mockResolvedValueOnce([{ id: 'event-1', content_unit_id: 'unit-1', platform_connection_id: 'conn-1' }]);
    // Mock unit
    mockWhere.mockResolvedValueOnce([{ id: 'unit-1', platform: 'x', brand_id: 'brand-1' }]);
    // Mock connection
    mockWhere.mockResolvedValueOnce([{ id: 'conn-1', platform: 'x', brand_id: 'brand-1' }]);
    // Let remaining mockWhere calls (for update) resolve normally to []

    await executePublish(data);

    expect(mockUpdate).toHaveBeenCalledWith(expect.anything());
    expect(getAdapter).toHaveBeenCalledWith('x');
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'unit-1', brandId: 'brand-1', platform: 'x' }),
      expect.objectContaining({ id: 'conn-1', brandId: 'brand-1', platform: 'x' })
    );
  });
  
  it('should update event with error if publishing fails', async () => {
    const data: JobPayloads['publish.execute'] = { publishEventId: 'event-1' };
    
    // Mock event
    mockWhere.mockResolvedValueOnce([{ id: 'event-1', content_unit_id: 'unit-1', platform_connection_id: 'conn-1' }]);
    // Mock unit
    mockWhere.mockResolvedValueOnce([{ id: 'unit-1', platform: 'x', brand_id: 'brand-1' }]);
    // Mock connection
    mockWhere.mockResolvedValueOnce([{ id: 'conn-1', platform: 'x', brand_id: 'brand-1' }]);

    mockPublish.mockRejectedValueOnce(new Error('Publish failed due to network'));

    await expect(executePublish(data)).rejects.toThrow('Publish failed due to network');
    
    // Should have tried to update event with error message
    expect(mockUpdate).toHaveBeenCalledWith(expect.anything());
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      error_message: 'Publish failed due to network'
    }));
  });
});
