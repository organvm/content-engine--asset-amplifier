import { describe, it, expect } from 'vitest';
import { computeFunnelStepMetrics } from './index.js';

describe('@cronus/audience-engine metrics', () => {
  it('should compute conversion rates correctly for empty event list', () => {
    const result = computeFunnelStepMetrics([]);
    expect(result.totalEvents).toBe(0);
    expect(result.uniqueSessions).toBe(0);
    expect(result.funnel).toHaveLength(4);
    expect(result.funnel[0].conversionRate).toBe(100);
    expect(result.funnel[1].conversionRate).toBe(0);
  });

  it('should compute accurate step-by-step conversion ratios', () => {
    const mockEvents = [
      { event_type: 'project_view', anonymous_session_id: 's1' },
      { event_type: 'project_view', anonymous_session_id: 's2' },
      { event_type: 'project_view', anonymous_session_id: 's3' },
      { event_type: 'project_view', anonymous_session_id: 's4' },
      { event_type: 'essay_open', anonymous_session_id: 's1' },
      { event_type: 'essay_open', anonymous_session_id: 's2' },
      { event_type: 'application_start', anonymous_session_id: 's1' },
    ];

    const result = computeFunnelStepMetrics(mockEvents);
    expect(result.totalEvents).toBe(7);
    expect(result.uniqueSessions).toBe(4);
    expect(result.funnel[0].count).toBe(4); // project_view
    expect(result.funnel[1].count).toBe(2); // essay_open -> 50%
    expect(result.funnel[1].conversionRate).toBe(50);
    expect(result.funnel[2].count).toBe(1); // application_start -> 50% of 2
    expect(result.funnel[2].conversionRate).toBe(50);
  });
});
