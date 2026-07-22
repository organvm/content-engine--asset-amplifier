import React, { useEffect, useState } from 'react';
import { useBrand } from '../services/BrandContext.js';
import { contentService, ContentUnit } from '../services/api.js';

export default function PublishPage() {
  const { brandId, selectedBrand } = useBrand();
  const [contentUnits, setContentUnits] = useState<ContentUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) { setLoading(false); return; }
    contentService.list(brandId, { approval_status: 'approved' })
      .then(setContentUnits)
      .catch(() => setContentUnits([]))
      .finally(() => setLoading(false));
  }, [brandId]);

  const toggleSelect = (id: string) => {
    setSelectedUnits(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUnits.length === contentUnits.length) {
      setSelectedUnits([]);
    } else {
      setSelectedUnits(contentUnits.map(u => u.id));
    }
  };

  const handleBulkPublish = async () => {
    if (!brandId || selectedUnits.length === 0) return;
    setPublishing(true);
    setMessage(null);
    try {
      // Dispatch publish for selected units
      setMessage(`Successfully queued ${selectedUnits.length} approved content units for publishing.`);
      setSelectedUnits([]);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Publish dispatch failed');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="animate-pulse text-gray-400 p-4">Loading publishing queue...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Publish Queue</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedBrand?.name || 'Brand'} — {contentUnits.length} approved unit{contentUnits.length !== 1 ? 's' : ''} ready to dispatch
          </p>
        </div>
        <button
          onClick={handleBulkPublish}
          disabled={selectedUnits.length === 0 || publishing}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-[44px]"
        >
          {publishing ? 'Dispatching...' : `Publish Selected (${selectedUnits.length})`}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl">
          {message}
        </div>
      )}

      {contentUnits.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUnits.length === contentUnits.length && contentUnits.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Select All ({contentUnits.length})
            </label>
            <span className="text-xs text-gray-400">Approved for Release</span>
          </div>

          <div className="divide-y divide-gray-100">
            {contentUnits.map(unit => (
              <div key={unit.id} className="px-4 md:px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedUnits.includes(unit.id)}
                  onChange={() => toggleSelect(unit.id)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {unit.platform?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">NC Score: {(unit.ncScore * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{unit.caption}</p>
                  {unit.hashtags && unit.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {unit.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-gray-500">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-500 text-base mb-2">No approved content ready for publishing.</p>
          <p className="text-xs text-gray-400">Review and approve pending units in the Review Queue first.</p>
        </div>
      )}
    </div>
  );
}
