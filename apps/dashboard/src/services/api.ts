import axios from 'axios';
import { Brand as DomainBrand, Asset as DomainAsset, ContentUnit as DomainContentUnit, NaturalCenter as DomainNaturalCenter } from '@cronus/domain';

export type Brand = Omit<DomainBrand, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };
export type Asset = Omit<DomainAsset, 'createdAt'> & { createdAt: string };
export type ContentUnit = Omit<DomainContentUnit, 'createdAt'> & { createdAt: string };
export type NaturalCenter = Omit<DomainNaturalCenter, 'createdAt'> & { createdAt: string };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

export const brandService = {
  list: () => api.get<Brand[]>('/brands').then(r => r.data),
  get: (id: string) => api.get<Brand>(`/brands/${id}`).then(r => r.data),
};

export const assetService = {
  list: (brandId: string) => api.get<Asset[]>(`/brands/${brandId}/assets`).then(r => r.data),
  upload: (brandId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Asset>(`/brands/${brandId}/assets`, formData).then(r => r.data);
  },
};

export const contentService = {
  list: (brandId: string, filters?: { approval_status?: string; platform?: string }) => 
    api.get<ContentUnit[]>(`/brands/${brandId}/content`, { params: filters }).then(r => r.data),
  get: (brandId: string, id: string) =>
    api.get<ContentUnit>(`/brands/${brandId}/content/${id}`).then(r => r.data),
  approve: (brandId: string, id: string) => api.post(`/brands/${brandId}/content/${id}/approve`),
  reject: (brandId: string, id: string, reason?: string) => 
    api.post(`/brands/${brandId}/content/${id}/reject`, { reason }),
  generate: (brandId: string, assetId: string) => 
    api.post(`/brands/${brandId}/generate`, { asset_id: assetId }),
};

export const identityService = {
  get: (brandId: string) => api.get<NaturalCenter>(`/brands/${brandId}/natural-center`).then(r => r.data),
  derive: (brandId: string, assetIds?: string[]) => 
    api.post(`/brands/${brandId}/natural-center`, { asset_ids: assetIds }),
  answerInquiry: (brandId: string, inquiryId: string, answer: string) =>
    api.post(`/brands/${brandId}/natural-center/inquiries/${inquiryId}/answer`, { answer }),
};

export interface AssetRoi {
  assetId: string;
  assetName: string;
  mediaType: string;
  createdAt: string;
  contentCount: number;
  approvedCount: number;
  platformCount: number;
  totalViews: number;
  totalEngagement: number;
}

export const analyticsService = {
  getAssetRoi: (brandId: string) => api.get<AssetRoi[]>(`/brands/${brandId}/roi`).then(r => r.data),
  getAssetAttribution: (brandId: string, assetId: string) =>
    api.get(`/brands/${brandId}/assets/${assetId}/attribution`).then(r => r.data),
};

export interface ArtworkProject {
  id: string;
  brandId: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: string;
  projectType: string;
  heroAssetId?: string;
  sourceAssetIds: string[];
  canonicalUrl?: string;
  linkedApplicationId?: string;
  hashtagTitle: string[];
  keywords: string[];
  influences: unknown[];
  canonicalEssay?: string;
  artistStatement?: string;
  processNote?: string;
  credits: unknown[];
  rights?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const projectService = {
  list: (brandId: string) => api.get<ArtworkProject[]>(`/brands/${brandId}/projects`).then(r => r.data),
  get: (brandId: string, id: string) => api.get<ArtworkProject>(`/brands/${brandId}/projects/${id}`).then(r => r.data),
  create: (brandId: string, data: { title: string; subtitle?: string; projectType?: string }) =>
    api.post<ArtworkProject>(`/brands/${brandId}/projects`, data).then(r => r.data),
  update: (brandId: string, id: string, data: Record<string, unknown>) =>
    api.patch<ArtworkProject>(`/brands/${brandId}/projects/${id}`, data).then(r => r.data),
  attachAsset: (brandId: string, id: string, assetId: string) =>
    api.post(`/brands/${brandId}/projects/${id}/assets`, { assetId }).then(r => r.data),
  detachAsset: (brandId: string, id: string, assetId: string) =>
    api.delete(`/brands/${brandId}/projects/${id}/assets/${assetId}`).then(r => r.data),
  getManifest: (brandId: string, id: string) =>
    api.get(`/brands/${brandId}/projects/${id}/manifest`).then(r => r.data),
};

// --- Publication Variants ---

export interface PublicationVariant {
  id: string;
  projectId: string;
  contentUnitId?: string;
  platform: string;
  format: string;
  editorialRole: string;
  caption: string;
  altText?: string;
  headline?: string;
  ctaLabel?: string;
  destinationUrl?: string;
  assetIds: string[];
  approvalStatus: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const variantService = {
  list: (brandId: string, projectId: string) =>
    api.get<PublicationVariant[]>(`/brands/${brandId}/projects/${projectId}/variants`).then(r => r.data),
  create: (brandId: string, projectId: string, data: {
    platform: string; caption: string; format?: string; editorialRole?: string;
    altText?: string; headline?: string; ctaLabel?: string; destinationUrl?: string;
  }) => api.post<PublicationVariant>(`/brands/${brandId}/projects/${projectId}/variants`, data).then(r => r.data),
  update: (brandId: string, projectId: string, variantId: string, data: Record<string, unknown>) =>
    api.patch<PublicationVariant>(`/brands/${brandId}/projects/${projectId}/variants/${variantId}`, data).then(r => r.data),
  remove: (brandId: string, projectId: string, variantId: string) =>
    api.delete(`/brands/${brandId}/projects/${projectId}/variants/${variantId}`).then(r => r.data),
};

// --- Linked Applications ---

export interface LinkedApplication {
  id: string;
  projectId: string;
  url: string;
  type: string;
  ctaLabel: string;
  healthStatus: string;
  privacy: string;
  trackingEnabled: boolean;
  campaignKey?: string;
  allowedEvents: string[];
  lastHealthCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export const linkedAppService = {
  get: (brandId: string, projectId: string) =>
    api.get<LinkedApplication>(`/brands/${brandId}/projects/${projectId}/application`).then(r => r.data).catch(() => null),
  create: (brandId: string, projectId: string, data: {
    url: string; ctaLabel: string; type?: string; privacy?: string;
    trackingEnabled?: boolean; campaignKey?: string; allowedEvents?: string[];
  }) => api.post<LinkedApplication>(`/brands/${brandId}/projects/${projectId}/application`, data).then(r => r.data),
  update: (brandId: string, projectId: string, appId: string, data: Record<string, unknown>) =>
    api.patch<LinkedApplication>(`/brands/${brandId}/projects/${projectId}/application/${appId}`, data).then(r => r.data),
  remove: (brandId: string, projectId: string, appId: string) =>
    api.delete(`/brands/${brandId}/projects/${projectId}/application/${appId}`).then(r => r.data),
};

// --- Conversion Events ---

export interface ConversionEvent {
  id: string;
  projectId: string;
  publishEventId?: string;
  anonymousSessionId: string;
  eventType: string;
  source?: string;
  medium?: string;
  campaign?: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface FunnelBucket {
  event_type: string;
  count: number;
}

export const conversionEventService = {
  list: (brandId: string, projectId: string) =>
    api.get<ConversionEvent[]>(`/brands/${brandId}/projects/${projectId}/events`).then(r => r.data),
  ingest: (brandId: string, projectId: string, data: {
    anonymousSessionId: string; eventType: string; publishEventId?: string;
    source?: string; medium?: string; campaign?: string; metadata?: Record<string, unknown>;
  }) => api.post<ConversionEvent>(`/brands/${brandId}/projects/${projectId}/events`, data).then(r => r.data),
  funnel: (brandId: string, projectId: string) =>
    api.get<FunnelBucket[]>(`/brands/${brandId}/projects/${projectId}/funnel`).then(r => r.data),
};

// --- Agencies ---

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  contactEmail: string;
  createdAt: string;
}

export const agencyService = {
  list: () => api.get<Agency[]>('/agencies').then(r => r.data),
  get: (id: string) => api.get<Agency>(`/agencies/${id}`).then(r => r.data),
  create: (data: { name: string; contactEmail: string; logoUrl?: string; primaryColor?: string }) =>
    api.post<Agency>('/agencies', data).then(r => r.data),
  listBrands: (id: string) => api.get<Brand[]>(`/agencies/${id}/brands`).then(r => r.data),
};
