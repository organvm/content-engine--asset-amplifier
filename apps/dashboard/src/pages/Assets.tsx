import React, { useEffect, useState } from 'react';
import { assetService } from '../services/api.js';
import { useBrand } from '../services/BrandContext.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Asset {
  id: string;
  mediaType: string;
  storageKey: string;
  originalFilename: string;
  processingStatus: string;
  fileSizeBytes: number;
  createdAt: string;
  fragmentCount: number;
}

export default function Assets() {
  const { brandId } = useBrand();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) { setLoading(false); return; }
    assetService.list(brandId).then(setAssets).finally(() => setLoading(false));
  }, [brandId]);

  if (loading) return <div className="animate-pulse text-gray-400 p-4">Loading assets...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Source Assets</h2>
        <p className="text-sm text-gray-500 mt-1">{assets.length} asset{assets.length !== 1 ? 's' : ''} uploaded</p>
      </div>

      {assets.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-500 mb-2">No assets yet.</p>
          <p className="text-xs text-gray-400">Upload a video or image to begin content generation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset: Asset) => (
            <div key={asset.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Preview */}
              <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                {asset.mediaType === 'image' ? (
                  <img
                    src={`${API_URL}/files/${asset.storageKey}`}
                    alt={asset.originalFilename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    <span className="text-xs text-gray-400">Video</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    asset.processingStatus === 'extracted' ? 'bg-green-100 text-green-700' :
                    asset.processingStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    asset.processingStatus === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {asset.processingStatus}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium text-gray-900 truncate">{asset.originalFilename}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{formatBytes(asset.fileSizeBytes)}</span>
                  <span>{asset.mediaType}</span>
                  <span>{timeAgo(asset.createdAt)}</span>
                </div>
                {asset.fragmentCount > 0 && (
                  <div className="text-xs text-blue-600 font-medium">{asset.fragmentCount} fragment{asset.fragmentCount !== 1 ? 's' : ''} extracted</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
