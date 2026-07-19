import React, { useEffect, useState } from 'react';
import { brandService, assetService, contentService } from '../services/api.js';
import { Link } from 'react-router-dom';
import { Asset, Brand, ContentUnit } from '@cronus/domain';

const API_URL = import.meta.env.VITE_API_URL || 'https://cronus-api.ivixivi.workers.dev';

export default function Dashboard() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [content, setContent] = useState<ContentUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandService.list().then(brands => {
      if (brands.length === 0) { setLoading(false); return; }
      const b = brands[0];
      setBrand(b);
      Promise.all([
        assetService.list(b.id),
        contentService.list(b.id),
      ]).then(([a, c]) => {
        setAssets(a);
        setContent(c);
      }).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-gray-400 p-4">Loading dashboard...</div>;

  const pending = content.filter((u) => u.approvalStatus === 'pending');
  const approved = content.filter((u) => u.approvalStatus === 'approved');
  const platforms = [...new Set(content.map((u) => u.platform))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{brand?.name || 'Brand'} Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Content yield engine dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{assets.length}</div>
          <div className="text-xs text-gray-500 mt-1">Assets Uploaded</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{content.length}</div>
          <div className="text-xs text-gray-500 mt-1">Content Generated</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">{pending.length}</div>
          <div className="text-xs text-gray-500 mt-1">Pending Review</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">{approved.length}</div>
          <div className="text-xs text-gray-500 mt-1">Approved</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      {platforms.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Content by Platform</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {platforms.map(platform => {
              const count = content.filter((u) => u.platform === platform).length;
              return (
                <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 capitalize">{platform.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Content */}
      {content.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Content</h3>
            <Link to="/review" className="text-sm text-blue-600 font-medium">View All →</Link>
          </div>
          <div className="space-y-3">
            {content.slice(0, 5).map((unit) => (
              <div key={unit.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {unit.mediaKey && (
                  <img
                    src={`${API_URL}/files/${unit.mediaKey}`}
                    alt=""
                    className="w-12 h-12 rounded object-cover bg-gray-200 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                      {unit.platform?.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      unit.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      unit.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {unit.approvalStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{unit.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {assets.length === 0 && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-500 text-base mb-4">No assets uploaded yet. Upload your first video or image to start generating content.</p>
          <p className="text-xs text-gray-400">Click "Upload Asset" in the header to begin.</p>
        </div>
      )}
    </div>
  );
}
