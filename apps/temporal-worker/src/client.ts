import { Client, Connection } from '@temporalio/client';
import { TASK_QUEUE } from './worker.js';

let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;
  const connection = await Connection.connect({ address: 'localhost:7233' });
  client = new Client({ connection });
  return client;
}

export async function startAssetProcessing(assetId: string): Promise<string> {
  const c = await getClient();
  const handle = await c.workflow.start('assetProcessingWorkflow', {
    args: [assetId],
    taskQueue: TASK_QUEUE,
    workflowId: `asset-process-${assetId}-${Date.now()}`,
  });
  return handle.workflowId;
}

export async function startContentGeneration(brandId: string, assetId: string): Promise<string> {
  const c = await getClient();
  const handle = await c.workflow.start('contentGenerationWorkflow', {
    args: [brandId, assetId],
    taskQueue: TASK_QUEUE,
    workflowId: `content-gen-${assetId}-${Date.now()}`,
  });
  return handle.workflowId;
}

export async function startNcDerivation(brandId: string): Promise<string> {
  const c = await getClient();
  const handle = await c.workflow.start('ncDerivationWorkflow', {
    args: [brandId],
    taskQueue: TASK_QUEUE,
    workflowId: `nc-derive-${brandId}-${Date.now()}`,
  });
  return handle.workflowId;
}

export async function startPublishing(contentUnitId: string, platform: string): Promise<string> {
  const c = await getClient();
  const handle = await c.workflow.start('publishingWorkflow', {
    args: [contentUnitId, platform],
    taskQueue: TASK_QUEUE,
    workflowId: `publish-${contentUnitId}-${Date.now()}`,
  });
  return handle.workflowId;
}

export async function startAnalyticsCollection(brandId: string): Promise<string> {
  const c = await getClient();
  const handle = await c.workflow.start('analyticsCollectionWorkflow', {
    args: [brandId],
    taskQueue: TASK_QUEUE,
    workflowId: `analytics-${brandId}-${Date.now()}`,
  });
  return handle.workflowId;
}
