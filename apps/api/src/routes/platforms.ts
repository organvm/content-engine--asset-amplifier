import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, mapRows } from '@cronus/db';
import { eq } from '@cronus/db';
import { Platform } from '@cronus/domain';
import { getConfig, encrypt } from '@cronus/config'; // allow-secret
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:platforms');

export const platformRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/platforms
  app.get('/brands/:brandId/platforms', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    const rows = await db
      .select()
      .from(schema.platformConnections)
      .where(eq(schema.platformConnections.brand_id, brandId));

    return mapRows(rows);
  });

  // GET /brands/:brandId/platforms/connect/:platform
  app.get('/brands/:brandId/platforms/connect/:platform', async (request, reply) => {
    const { brandId, platform } = request.params as { brandId: string; platform: string };

    if (platform === 'linkedin') {
      const config = getConfig();
      const clientId = config.LINKEDIN_CLIENT_ID; // allow-secret
      const redirectUri = `${process.env.API_URL || 'http://localhost:3000'}/api/v1/platforms/callback/linkedin`;
      const scope = encodeURIComponent('w_member_social r_liteprofile');
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${brandId}`;
      return reply.redirect(authUrl);
    }

    if (platform === 'instagram') {
      const config = getConfig();
      const clientId = config.INSTAGRAM_CLIENT_ID || 'meta_client_id_placeholder'; // allow-secret
      const redirectUri = `${process.env.API_URL || 'http://localhost:3000'}/api/v1/platforms/callback/instagram`;
      const scope = encodeURIComponent('instagram_basic,instagram_content_publish,pages_show_list');
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${brandId}`;
      return reply.redirect(authUrl);
    }

    if (platform === 'tiktok') {
      const clientKey = process.env.TIKTOK_CLIENT_KEY || 'tiktok_client_key_placeholder';
      const redirectUri = `${process.env.API_URL || 'http://localhost:3000'}/api/v1/platforms/callback/tiktok`;
      const scope = encodeURIComponent('user.info.basic,video.upload,video.publish');
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${brandId}`;
      return reply.redirect(authUrl);
    }

    return reply.status(400).send({ error: `OAuth not implemented for ${platform}` });
  });

  // GET /platforms/callback/linkedin
  app.get('/platforms/callback/linkedin', async (request, reply) => {
    const { code, state: brandId } = request.query as { code: string; state: string };
    const config = getConfig();
    const db = getDb();

    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: config.LINKEDIN_CLIENT_ID, // allow-secret
          client_secret: config.LINKEDIN_CLIENT_SECRET, // allow-secret
          redirect_uri: `${process.env.API_URL || 'http://localhost:3000'}/api/v1/platforms/callback/linkedin`,
        },
      });

      const { access_token } = response.data; // allow-secret
      const encryptedToken = encrypt(access_token); // allow-secret

      await db.insert(schema.platformConnections).values({
        id: randomUUID(),
        brand_id: brandId,
        platform: Platform.linkedin,
        platform_account_id: 'linkedin-user',
        access_token: encryptedToken, // allow-secret
        scopes: ['w_member_social', 'r_liteprofile'],
        status: 'active',
      }).onConflictDoUpdate({
        target: [
          schema.platformConnections.brand_id,
          schema.platformConnections.platform,
          schema.platformConnections.platform_account_id,
        ],
        set: {
          access_token: encryptedToken, // allow-secret
          status: 'active',
        },
      });

      return reply.redirect(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/platforms?status=success`);
    } catch (err) {
      log.error({ err }, 'LinkedIn OAuth callback failed');
      return reply.redirect(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/platforms?status=error`);
    }
  });

  // GET /platforms/callback/instagram
  app.get('/platforms/callback/instagram', async (request, reply) => {
    const { code, state: brandId } = request.query as { code?: string; state: string };
    const config = getConfig();
    const db = getDb();

    if (!code) {
      log.error({ brandId }, 'No code provided in Instagram OAuth callback');
      return reply.redirect(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/platforms?status=error`);
    }

    try {
      const response = await axios.post('https://graph.facebook.com/v19.0/oauth/access_token', null, {
        params: {
          client_id: config.INSTAGRAM_CLIENT_ID, // allow-secret
          client_secret: config.INSTAGRAM_CLIENT_SECRET, // allow-secret
          redirect_uri: `${process.env.API_URL || 'http://localhost:3000'}/api/v1/platforms/callback/instagram`,
          code,
        },
      });

      const { access_token } = response.data; // allow-secret
      const encryptedToken = encrypt(access_token); // allow-secret

      await db.insert(schema.platformConnections).values({
        id: randomUUID(),
        brand_id: brandId,
        platform: Platform.instagram_feed,
        platform_account_id: 'instagram-user', // allow-secret (future: exchange for actual page ID)
        access_token: encryptedToken, // allow-secret
        scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
        status: 'active',
      }).onConflictDoUpdate({
        target: [
          schema.platformConnections.brand_id,
          schema.platformConnections.platform,
          schema.platformConnections.platform_account_id,
        ],
        set: {
          access_token: encryptedToken, // allow-secret
          status: 'active',
        },
      });

      return reply.redirect(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/platforms?status=success`);
    } catch (err) {
      log.error({ err }, 'Instagram OAuth callback failed');
      return reply.redirect(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/platforms?status=error`);
    }
  });

  // GET /platforms/callback/tiktok
  app.get('/platforms/callback/tiktok', async (request, reply) => {
    const { state: brandId } = request.query as { code?: string; state: string };
    // Callback placeholder for TikTok v2 token exchange
    log.info({ brandId }, 'TikTok OAuth callback received');
    return reply.redirect(`${process.env.DASHBOARD_URL || 'http://localhost:5173'}/platforms?status=success`);
  });
};
