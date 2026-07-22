export interface CampaignGeneratedPayload {
  event: 'campaign.generated';
  eventId: string;
  timestamp: string;
  brandId: string;
  projectId: string;
  title: string;
  slug: string;
  canonicalUrl?: string | null;
  heroAssetId?: string | null;
  contentUnits: Array<{
    id: string;
    platform: string;
    caption: string;
    mediaKey: string;
    mediaType: string;
    hashtags: string[];
    approvalStatus: string;
  }>;
  linkedApplication?: {
    id: string;
    url: string;
    type: string;
    campaignKey?: string | null;
  } | null;
}

export interface WebhookDeliveryResult {
  url: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}
