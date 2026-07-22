import { Worker, bundleWorkflowCode } from '@temporalio/worker';
import { createLogger } from '@cronus/logger';
import * as assetActivities from '../../infra/temporal/activities/asset-activities.js';
import * as contentActivities from '../../infra/temporal/activities/content-activities.js';
import * as ncActivities from '../../infra/temporal/activities/nc-activities.js';
import * as publishingActivities from '../../infra/temporal/activities/publishing-activities.js';
import * as analyticsActivities from '../../infra/temporal/activities/analytics-activities.js';

export const TASK_QUEUE = 'cronus-content-engine';
const log = createLogger('temporal-worker');

async function run(): Promise<void> {
  const bundle = await bundleWorkflowCode({
    workflowsPath: new URL('./workflows.ts', import.meta.url).pathname,
  });

  const worker = await Worker.create({
    workflowBundle: bundle,
    activities: {
      ...assetActivities,
      ...contentActivities,
      ...ncActivities,
      ...publishingActivities,
      ...analyticsActivities,
    },
    taskQueue: TASK_QUEUE,
    identity: 'cronus-temporal-worker',
  });

  log.info({ taskQueue: TASK_QUEUE }, 'Temporal Worker started');
  await worker.run();
}

run().catch((err) => {
  log.error({ err }, 'Temporal Worker failed');
  process.exit(1);
});
