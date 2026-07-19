import React, { useEffect, useState, useCallback } from 'react';
import { contentService } from '../services/api.js';
import { useBrand } from '../services/BrandContext.js';
import { ContentUnit } from '@cronus/domain';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://cronus-api.ivixivi.workers.dev';

type Toast = { id: number; message: string; type: 'success' | 'error' };

export default function ReviewQueue() {
  const { brandId } = useBrand();
  const [units, setUnits] = useState<ContentUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);

  const fetchContent = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const data = await contentService.list(brandId);
      setUnits(data);
    } catch {
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleApprove = async (id: string) => {
    if (!brandId || actionInFlight) return;
    setActionInFlight(id);
    try {
      await contentService.approve(brandId, id);
      showToast('Content approved');
      await fetchContent();
    } catch {
      showToast('Failed to approve', 'error');
    } finally {
      setActionInFlight(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!brandId || actionInFlight) return;
    setActionInFlight(id);
    try {
      await contentService.reject(brandId, id);
      showToast('Content rejected');
      await fetchContent();
    } catch {
      showToast('Failed to reject', 'error');
    } finally {
      setActionInFlight(null);
    }
  };

  const filtered = filter === 'all'
    ? units
    : units.filter(u => u.approvalStatus === filter);

  const counts = {
    all: units.length,
    pending: units.filter(u => u.approvalStatus === 'pending').length,
    approved: units.filter(u => u.approvalStatus === 'approved').length,
    rejected: units.filter(u => u.approvalStatus === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg pointer-events-auto animate-[fadeIn_0.2s_ease-out] ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Review Queue</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Review AI-generated content for your brand.
          </p>
        </div>
        <div className="self-start text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full min-h-[36px] flex items-center">
          {counts.all} Total &middot; {counts.pending} Pending
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap min-h-[44px] transition-colors ${
              filter === status
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200 md:hover:bg-gray-200'
            }`}
          >
            {status} ({counts[status]})
          </button>
        ))}
      </div>

      {/* Content grid or empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          {units.length === 0 ? (
            <>
              <div className="text-4xl mb-4 opacity-40">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </div>
              <p className="text-gray-700 text-base font-semibold mb-2">No content yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Upload a hero asset to generate your first batch of platform-ready content.
              </p>
              <Link
                to="/assets"
                className="inline-flex items-center px-4 py-3 bg-black text-white text-sm font-bold rounded-lg active:bg-gray-700 md:hover:bg-gray-800 transition-colors min-h-[44px]"
              >
                Upload an Asset
              </Link>
            </>
          ) : (
            <p className="text-gray-500 text-base">
              No {filter === 'all' ? '' : filter} content to show.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map(unit => (
            <Link key={unit.id} to={`/content/${unit.id}`} className="block">
              <ContentCard
                unit={unit}
                onApprove={handleApprove}
                onReject={handleReject}
                disabled={actionInFlight === unit.id}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content card component
// ---------------------------------------------------------------------------

function ContentCard({
  unit,
  onApprove,
  onReject,
  disabled,
}: {
  unit: ContentUnit;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  disabled: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'flagged':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm active:shadow-md md:hover:shadow-md transition-shadow">
      {/* Media preview from R2 */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {unit.mediaKey && !imgError ? (
          <img
            src={`${API_URL}/files/${unit.mediaKey}`}
            alt={unit.caption ? unit.caption.slice(0, 80) : 'Generated content'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}

        {/* Platform badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded text-xs font-bold uppercase min-h-[28px] flex items-center">
          {unit.platform?.replace(/_/g, ' ')}
        </div>

        {/* Status badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1.5 rounded text-xs font-bold uppercase min-h-[28px] flex items-center ${statusBadge(unit.approvalStatus)}`}>
          {unit.approvalStatus}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 space-y-4">
        {/* NC Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-h-[44px]">
            <span className="text-sm font-semibold text-gray-400">NC Score:</span>
            <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
              unit.ncScore > 0.8
                ? 'text-green-700 bg-green-50'
                : unit.ncScore > 0.5
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-red-700 bg-red-50'
            }`}>
              {(unit.ncScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Caption */}
        <p className="text-base text-gray-800 line-clamp-4 leading-relaxed">
          {unit.caption}
        </p>

        {/* Hashtags */}
        {unit.hashtags && unit.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {unit.hashtags.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons — only show for pending content */}
        {unit.approvalStatus === 'pending' && (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-2">
            <button
              onClick={() => onApprove(unit.id)}
              disabled={disabled}
              className="flex-1 bg-black text-white text-sm font-bold py-3 sm:py-2 rounded-lg active:bg-gray-700 md:hover:bg-gray-800 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disabled ? 'Working...' : 'Approve'}
            </button>
            <button
              onClick={() => onReject(unit.id)}
              disabled={disabled}
              className="flex-1 bg-white border border-gray-200 text-gray-700 text-sm font-bold py-3 sm:py-2 rounded-lg active:bg-gray-100 md:hover:bg-gray-50 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disabled ? 'Working...' : 'Reject'}
            </button>
          </div>
        )}

        {/* Status indicator for non-pending */}
        {unit.approvalStatus !== 'pending' && (
          <div className="pt-2 text-center">
            <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg min-h-[44px] leading-[28px] ${statusBadge(unit.approvalStatus)}`}>
              {unit.approvalStatus === 'approved' ? 'Approved' : unit.approvalStatus === 'rejected' ? 'Rejected' : unit.approvalStatus}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
