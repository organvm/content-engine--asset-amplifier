const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Asset {
  id: string;
  brand_id: string;
  media_type: string;
  original_filename: string;
  processing_status: string;
  created_at: string;
}

export interface ContentUnit {
  id: string;
  brand_id: string;
  platform: string;
  caption: string;
  media_key: string;
  media_type: string;
  approval_status: string;
  nc_score: number;
}

export const brandService = {
  list: async (): Promise<Brand[]> => {
    const res = await fetch(`${API_URL}/brands`);
    if (!res.ok) throw new Error(`Failed to fetch brands: ${res.status}`);
    return res.json();
  },
};

export const assetService = {
  list: async (brandId: string): Promise<Asset[]> => {
    const res = await fetch(`${API_URL}/brands/${brandId}/assets`);
    if (!res.ok) throw new Error(`Failed to fetch assets: ${res.status}`);
    return res.json();
  },
};

export const contentService = {
  list: async (brandId: string, filters?: { approval_status?: string; platform?: string }): Promise<ContentUnit[]> => {
    const params = new URLSearchParams();
    if (filters?.approval_status) params.set('approval_status', filters.approval_status);
    if (filters?.platform) params.set('platform', filters.platform);
    const query = params.toString();
    const res = await fetch(`${API_URL}/brands/${brandId}/content${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`);
    return res.json();
  },

  approve: async (brandId: string, unitId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/brands/${brandId}/content/${unitId}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to approve: ${res.status}`);
  },

  reject: async (brandId: string, unitId: string, reason?: string): Promise<void> => {
    const res = await fetch(`${API_URL}/brands/${brandId}/content/${unitId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error(`Failed to reject: ${res.status}`);
  },
};
