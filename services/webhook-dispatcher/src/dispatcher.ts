import crypto from 'node:crypto';
import { createLogger } from '@cronus/logger';
import { getDb, schema, eq, inArray } from '@cronus/db';
import type { CampaignGeneratedPayload, WebhookDeliveryResult } from './types.js';
import { computeHmacSignature } from './signature.js';

const log = createLogger('webhook-dispatcher');

export async function sendWebhookHttpRequest(
  targetUrl: string,
  payload: CampaignGeneratedPayload,
  secret?: string,
): Promise<WebhookDeliveryResult> {
  const bodyString = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Cronus-Metabolus-Swarm-Webhook/1.0',
    'X-Cronus-Event': payload.event,
    'X-Cronus-Delivery': payload.eventId,
  };

  if (secret) {
    headers['X-Cronus-Signature'] = computeHmacSignature(bodyString, secret);
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: bodyString,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      log.warn({ targetUrl, status: response.status }, 'Webhook HTTP delivery failed');
      return { url: targetUrl, success: false, statusCode: response.status, error: response.statusText };
    }

    log.info({ targetUrl, status: response.status }, 'Webhook delivered successfully');
    return { url: targetUrl, success: true, statusCode: response.status };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log.error({ targetUrl, error: errorMsg }, 'Webhook HTTP fetch exception');
    return { url: targetUrl, success: false, error: errorMsg };
  }
}

export async function dispatchCampaignGeneratedEvent(
  projectId: string,
  overrideTargetUrl?: string,
  overrideSecret?: string,
): Promise<WebhookDeliveryResult[]> {
  const db = getDb();

  const [project] = await db.select().from(schema.artworkProjects).where(eq(schema.artworkProjects.id, projectId));
  if (!project) throw new Error(`Project ${projectId} not found`);

  const variants = await db.select().from(schema.publicationVariants).where(eq(schema.publicationVariants.project_id, projectId));
  const contentUnitIds = variants.map(v => v.content_unit_id).filter((id): id is string => id !== null);
  const contentUnits = contentUnitIds.length > 0
    ? await db.select().from(schema.contentUnits).where(inArray(schema.contentUnits.id, contentUnitIds))
    : [];

  const linkedApps = await db.select().from(schema.linkedApplications).where(eq(schema.linkedApplications.project_id, projectId));

  const payload: CampaignGeneratedPayload = {
    event: 'campaign.generated',
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    brandId: project.brand_id,
    projectId: project.id,
    title: project.title,
    slug: project.slug,
    canonicalUrl: project.canonical_url,
    heroAssetId: project.hero_asset_id,
    contentUnits: contentUnits.map(cu => ({
      id: cu.id,
      platform: cu.platform,
      caption: cu.caption,
      mediaKey: cu.media_key,
      mediaType: cu.media_type,
      hashtags: (cu.hashtags as string[]) || [],
      approvalStatus: cu.approval_status,
    })),
    linkedApplication: linkedApps[0] ? {
      id: linkedApps[0].id,
      url: linkedApps[0].url,
      type: linkedApps[0].type,
      campaignKey: linkedApps[0].campaign_key,
    } : null,
  };

  const targets: Array<{ url: string; secret?: string }> = [];

  if (overrideTargetUrl) {
    targets.push({ url: overrideTargetUrl, secret: overrideSecret });
  } else {
    for (const app of linkedApps) {
      const allowed = (app.allowed_events as string[]) || [];
      if (allowed.length === 0 || allowed.includes('campaign.generated')) {
        targets.push({ url: app.url, secret: app.campaign_key || undefined });
      }
    }

    const swarmUrls = process.env.SWARM_WEBHOOK_URLS;
    if (swarmUrls) {
      const pairs = swarmUrls.split(',');
      for (const pair of pairs) {
        const [name, url] = pair.split('=');
        if (url) {
          targets.push({
            url: url.trim(),
            secret: process.env[`SWARM_SECRET_${name.toUpperCase().replace(/-/g, '_')}`],
          });
        }
      }
    }
  }

  if (targets.length === 0) {
    log.info({ projectId }, 'No webhook targets found for campaign.generated event');
    return [];
  }

  const results = await Promise.all(targets.map(t => sendWebhookHttpRequest(t.url, payload, t.secret)));
  return results;
}
