import axios from 'axios';
import { Brand, Asset, ContentUnit, NaturalCenter } from '@cronus/domain';

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
