import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { brandService } from './api.js';
import { Brand } from '@cronus/domain';

interface BrandContextValue {
  brands: Brand[];
  selectedBrand: Brand | null;
  brandId: string | null;
  loading: boolean;
  error: string | null;
  selectBrand: (id: string) => void;
}

const BrandContext = createContext<BrandContextValue>({
  brands: [],
  selectedBrand: null,
  brandId: null,
  loading: true,
  error: null,
  selectBrand: () => {},
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    brandService.list()
      .then(data => {
        setBrands(data);
        const persisted = localStorage.getItem('cronus_brand_id');
        const match = persisted && data.some(b => b.id === persisted);
        setSelectedBrandId(match ? persisted : data[0]?.id ?? null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectBrand = useCallback((id: string) => {
    setSelectedBrandId(id);
    localStorage.setItem('cronus_brand_id', id);
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId) ?? null;

  return (
    <BrandContext.Provider value={{ brands, selectedBrand, brandId: selectedBrandId, loading, error, selectBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
