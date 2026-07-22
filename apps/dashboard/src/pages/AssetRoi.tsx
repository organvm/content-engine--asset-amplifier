import React, { useEffect, useState } from 'react';
import { analyticsService, AssetRoi } from '../services/api.js';
import { useBrand } from '../services/BrandContext.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AssetRoiPage() {
  const { brandId, selectedBrand } = useBrand();
  const [assets, setAssets] = useState<AssetRoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'totalViews' | 'contentCount' | 'totalEngagement'>('totalViews');

  useEffect(() => {
    if (!brandId) { setLoading(false); return; }
    analyticsService.getAssetRoi(brandId)
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [brandId]);

  if (loading) return <div className="animate-pulse text-gray-400 p-4">Loading ROI data...</div>;

  const totalContent = assets.reduce((s, a) => s + a.contentCount, 0);
  const totalApproved = assets.reduce((s, a) => s + a.approvedCount, 0);
  const totalViews = assets.reduce((s, a) => s + a.totalViews, 0);
  const totalEngagement = assets.reduce((s, a) => s + a.totalEngagement, 0);
  const avgEngagementRate = totalViews > 0 ? (totalEngagement / totalViews * 100).toFixed(1) : '0.0';
  const yieldRatio = totalContent > 0 ? (totalApproved / totalContent * 100).toFixed(0) : '0';
  const _contentPerAsset = assets.length > 0 ? (totalContent / assets.length).toFixed(1) : '0';

  const sorted = [...assets].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Asset ROI</h2>
        <p className="text-sm text-gray-500 mt-1">
          {selectedBrand?.name || 'Brand'} — {assets.length} asset{assets.length !== 1 ? 's' : ''} uploaded
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{assets.length}</div>
          <div className="text-xs text-gray-500 mt-1">Source Assets</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{totalContent}</div>
          <div className="text-xs text-gray-500 mt-1">Content Generated</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">{yieldRatio}%</div>
          <div className="text-xs text-gray-500 mt-1">Yield Ratio</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{formatNumber(totalViews)}</div>
          <div className="text-xs text-gray-500 mt-1">Total Views</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">{avgEngagementRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Engagement Rate</div>
        </div>
      </div>

      {/* Per-asset table */}
      {assets.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Per-Asset Breakdown</h3>
            <div className="flex gap-1">
              {([
                { key: 'totalViews' as const, label: 'Views' },
                { key: 'contentCount' as const, label: 'Content' },
                { key: 'totalEngagement' as const, label: 'Engagement' },
              ]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                    sortKey === opt.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {sorted.map(asset => {
              const engRate = asset.totalViews > 0
                ? (asset.totalEngagement / asset.totalViews * 100).toFixed(1)
                : '0.0';
              const approvalRate = asset.contentCount > 0
                ? (asset.approvedCount / asset.contentCount * 100).toFixed(0)
                : '0';

              return (
                <div key={asset.assetId} className="px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail placeholder */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                      {asset.mediaType === 'image' ? (
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653Z" />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{asset.assetName}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>{asset.mediaType}</span>
                        <span>{asset.contentCount} content</span>
                        <span>{asset.approvedCount} approved ({approvalRate}%)</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-gray-900">{formatNumber(asset.totalViews)}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Views</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-gray-900">{formatNumber(asset.totalEngagement)}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Engagement</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">{engRate}%</div>
                        <div className="text-[10px] text-gray-400 uppercase">Eng. Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-500 text-base mb-2">No ROI data yet.</p>
          <p className="text-xs text-gray-400">Upload assets and publish content to see performance metrics.</p>
        </div>
      )}
      {/* Bar chart: Content output by asset */}
      {assets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Content Output by Asset</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sorted.slice(0, 8).map(a => ({ name: a.assetName.slice(0, 20), generated: a.contentCount, approved: a.approvedCount }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="generated" fill="#6366f1" name="Generated" />
              <Bar dataKey="approved" fill="#22c55e" name="Approved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
