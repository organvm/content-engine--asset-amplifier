/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { sendWebhookHttpRequest } from './dispatcher.js';
import { computeHmacSignature, verifyHmacSignature } from './signature.js';
import type { CampaignGeneratedPayload } from './types.js';

describe('Webhook Dispatcher Unit & Integration Tests', () => {
  let server: http.Server;
  let serverUrl: string;
  let receivedRequests: Array<{ headers: Record<string, any>; body: any; rawBody: string }> = [];

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      let bodyData = '';
      req.on('data', (chunk) => { bodyData += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(bodyData);
          receivedRequests.push({ headers: req.headers as any, body: parsed, rawBody: bodyData });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid json' }));
        }
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        serverUrl = `http://127.0.0.1:${addr.port}/webhook`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('computes and verifies HMAC SHA256 signatures correctly', () => {
    const payload = JSON.stringify({ hello: 'world' });
    const secret = 'super-secret-key-123';
    const sig = computeHmacSignature(payload, secret);
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
    expect(verifyHmacSignature(payload, secret, sig)).toBe(true);
    expect(verifyHmacSignature(payload, 'wrong-secret', sig)).toBe(false);
  });

  it('dispatches campaign.generated event to HTTP endpoint with valid headers and payload', async () => {
    receivedRequests = [];

    const mockPayload: CampaignGeneratedPayload = {
      event: 'campaign.generated',
      eventId: 'evt-12345',
      timestamp: new Date().toISOString(),
      brandId: 'brand-999',
      projectId: 'proj-888',
      title: 'Aetheria Campaign',
      slug: 'aetheria-campaign',
      canonicalUrl: 'https://example.com/aetheria',
      heroAssetId: 'asset-111',
      contentUnits: [
        {
          id: 'cu-1',
          platform: 'instagram_feed',
          caption: 'Explore Aetheria now!',
          mediaKey: 'brands/brand-999/assets/cu-1.png',
          mediaType: 'image',
          hashtags: ['aetheria', 'rpg'],
          approvalStatus: 'approved',
        },
      ],
      linkedApplication: {
        id: 'app-555',
        url: serverUrl,
        type: 'classroom-rpg-aetheria',
        campaignKey: 'secret-aetheria-key',
      },
    };

    const secret = 'secret-aetheria-key';
    const result = await sendWebhookHttpRequest(serverUrl, mockPayload, secret);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(receivedRequests.length).toBe(1);

    const req = receivedRequests[0];
    expect(req.headers['x-cronus-event']).toBe('campaign.generated');
    expect(req.headers['x-cronus-delivery']).toBe('evt-12345');
    expect(req.headers['x-cronus-signature']).toBeDefined();

    const signature = req.headers['x-cronus-signature'] as string;
    const isValidSignature = verifyHmacSignature(req.rawBody, secret, signature);
    expect(isValidSignature).toBe(true);
    expect(req.body.event).toBe('campaign.generated');
    expect(req.body.projectId).toBe('proj-888');
    expect(req.body.contentUnits[0].platform).toBe('instagram_feed');
  });

  it('handles target HTTP failure gracefully', async () => {
    const invalidUrl = 'http://127.0.0.1:1/non-existent-port';
    const mockPayload: CampaignGeneratedPayload = {
      event: 'campaign.generated',
      eventId: 'evt-error',
      timestamp: new Date().toISOString(),
      brandId: 'brand-1',
      projectId: 'proj-1',
      title: 'Fail Test',
      slug: 'fail-test',
      contentUnits: [],
    };

    const result = await sendWebhookHttpRequest(invalidUrl, mockPayload);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
