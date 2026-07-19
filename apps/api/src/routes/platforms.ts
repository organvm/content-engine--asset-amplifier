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
    const config = getConfig();

    if (platform === 'linkedin') {
      const clientId = config.LINKEDIN_CLIENT_ID; // allow-secret
      const redirectUri = `${process.env.API_URL}/api/v1/platforms/callback/linkedin`;
      const scope = encodeURIComponent('w_member_social r_liteprofile');

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${brandId}`;

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
      // 1. Exchange code for token
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: config.LINKEDIN_CLIENT_ID, // allow-secret
          client_secret: config.LINKEDIN_CLIENT_SECRET, // allow-secret
          redirect_uri: `${process.env.API_URL}/api/v1/platforms/callback/linkedin`,
        },
      });

      const { access_token } = response.data; // allow-secret

      // 2. Encrypt token
      const encryptedToken = encrypt(access_token); // allow-secret

      // 3. Upsert platform connection
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

      return reply.redirect(`${process.env.DASHBOARD_URL}/platforms?status=success`);
    } catch (err) {
      log.error({ err }, 'LinkedIn OAuth callback failed');
      return reply.redirect(`${process.env.DASHBOARD_URL}/platforms?status=error`);
    }
  });
};
