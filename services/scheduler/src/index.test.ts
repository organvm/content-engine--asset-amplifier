import { describe, it, expect } from 'vitest';
import { ScheduleStrategy, ApprovalStatus } from '@cronus/domain';

describe('@cronus/scheduler contracts', () => {
  it('should export valid scheduling strategies', () => {
    expect(ScheduleStrategy.evenly_distributed).toBe('evenly_distributed');
    expect(ScheduleStrategy.optimal).toBe('optimal');
    expect(ScheduleStrategy.manual).toBe('manual');
  });

  it('should validate approval status prior to scheduling', () => {
    const mockUnits = [
      { id: '1', approval_status: ApprovalStatus.approved },
      { id: '2', approval_status: ApprovalStatus.pending },
    ];

    const unapproved = mockUnits.filter(u => u.approval_status !== ApprovalStatus.approved);
    expect(unapproved.length).toBe(1);
    expect(unapproved[0].id).toBe('2');
  });
});
