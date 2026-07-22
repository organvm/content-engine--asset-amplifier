import { calculateCosineSimilarity, querySimilarNaturalCenters } from '@cronus/scoring';
import { computeWeeklyReportSummary } from '@cronus/analytics';
import { computeFunnelStepMetrics } from '@cronus/audience-engine';
import { findDuplicateContentUnits } from '@cronus/content-generation';

/**
 * End-to-End Cronus Metabolus Engine Pipeline Demonstration
 * 
 * Tests the computational logic across scoring, analytics, audience funnel,
 * and content deduplication in a single unified execution pass.
 */
async function runEndToEndDemo() {
  console.log('=== Cronus Metabolus Content Engine E2E Pipeline ===\n');

  // 1. Scoring & Cosine Distance Engine
  console.log('1. Testing Natural Center Vector Scoring...');
  const vectorA = [0.1, 0.5, 0.9, 0.2];
  const vectorB = [0.1, 0.45, 0.88, 0.22];
  const similarity = calculateCosineSimilarity(vectorA, vectorB);
  console.log(`✔ Cosine Similarity Score: ${(similarity * 100).toFixed(2)}% (Threshold: 75.00%)\n`);

  // 2. Content Deduplication
  console.log('2. Testing Cross-Platform Deduplication Engine...');
  const sampleUnits = [
    { id: 'u1', platform: 'instagram_feed', caption: 'Deconstructing autonomous media instruments', mediaKey: 'img_001.png' },
    { id: 'u2', platform: 'instagram_feed', caption: 'Deconstructing autonomous media instruments', mediaKey: 'img_002.png' },
    { id: 'u3', platform: 'linkedin', caption: 'Deconstructing autonomous media instruments', mediaKey: 'img_001.png' },
  ];
  const duplicates = findDuplicateContentUnits(sampleUnits);
  console.log(`✔ Input Units: ${sampleUnits.length} | Flagged Duplicates: ${duplicates.length}`);
  duplicates.forEach(d => console.log(`  └─ Unit ${d.id}: ${d.reason}`));
  console.log('');

  // 3. Audience Engine Conversion Funnel
  console.log('3. Testing Audience Engine Conversion Funnel...');
  const events = [
    { event_type: 'project_view', anonymous_session_id: 'session-1' },
    { event_type: 'project_view', anonymous_session_id: 'session-2' },
    { event_type: 'project_view', anonymous_session_id: 'session-3' },
    { event_type: 'essay_open', anonymous_session_id: 'session-1' },
    { event_type: 'essay_open', anonymous_session_id: 'session-2' },
    { event_type: 'application_start', anonymous_session_id: 'session-1' },
    { event_type: 'relay_complete', anonymous_session_id: 'session-1' },
  ];
  const funnelMetrics = computeFunnelStepMetrics(events);
  console.log(`✔ Total Events: ${funnelMetrics.totalEvents} across ${funnelMetrics.uniqueSessions} unique sessions:`);
  funnelMetrics.funnel.forEach(step => {
    console.log(`  └─ ${step.eventType.padEnd(18)} : ${step.count} (${step.conversionRate}%)`);
  });
  console.log('');

  // 4. Analytics Weekly Report Summary
  console.log('4. Testing Analytics Weekly Report Generation...');
  const report = computeWeeklyReportSummary({
    brandId: 'cronus-brand',
    weekStart: new Date('2026-07-14'),
    weekEnd: new Date('2026-07-21'),
    postsPublished: 12,
    totalViews: 45000,
    totalEngagement: 3820,
    assetAttributions: [
      { assetId: 'ast-1', originalFilename: 'hero_instrument.mp4', totalViews: 30000, totalEngagement: 2800 },
      { assetId: 'ast-2', originalFilename: 'diagram_stills.png', totalViews: 15000, totalEngagement: 1020 },
    ],
  });
  console.log(`✔ Report Range       : ${report.weekStart.toISOString().split('T')[0]} to ${report.weekEnd.toISOString().split('T')[0]}`);
  console.log(`✔ Published Posts    : ${report.totalPostsPublished}`);
  console.log(`✔ Total Views        : ${report.totalViews.toLocaleString()}`);
  console.log(`✔ Total Engagement   : ${report.totalEngagement.toLocaleString()}`);
  console.log(`✔ Engagement Rate    : ${(report.engagementRate * 100).toFixed(2)}%\n`);

  console.log('=== Pipeline Execution Completed Successfully ===');
}

runEndToEndDemo().catch(err => {
  console.error('E2E Demo Failed:', err);
  process.exit(1);
});
