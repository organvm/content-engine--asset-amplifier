import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentService, ContentUnit } from '../services/api.js';
import { useBrand } from '../services/BrandContext.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function scoreColor(score: number): string {
  if (score > 0.8) return 'text-green-700 bg-green-50';
  if (score > 0.5) return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

function statusBadge(status: string): string {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    case 'flagged': return 'bg-orange-100 text-orange-700';
    default: return 'bg-yellow-100 text-yellow-700';
  }
}

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { brandId } = useBrand();
  const [unit, setUnit] = useState<ContentUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (!brandId || !id) { setLoading(false); return; }
    contentService.get(brandId, id)
      .then(setUnit)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [brandId, id]);

  const handleRegenerate = async () => {
    if (!brandId || !unit || regenerating) return;
    setRegenerating(true);
    try {
      await contentService.generate(brandId, unit.fragmentId);
      navigate('/review');
    } catch {
      setError('Re-generation failed. Please try again.');
      setRegenerating(false);
    }
  };

  if (loading) return <div className="animate-pulse text-gray-400 p-4">Loading content...</div>;
  if (error || !unit) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">&larr; Back</button>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500">{error || 'Content not found.'}</p>
        </div>
      </div>
    );
  }

  const breakdownEntries = unit.ncScoreBreakdown
    ? Object.entries(unit.ncScoreBreakdown)
    : [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">&larr; Back to Review</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
              {unit.mediaKey && !imgError ? (
                <img
                  src={`${API_URL}/files/${unit.mediaKey}`}
                  alt={unit.caption?.slice(0, 80) || 'Content'}
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="text-sm">No media available</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded text-xs font-bold uppercase">
                {unit.platform?.replace(/_/g, ' ')}
              </div>
              <div className={`absolute top-3 left-3 px-2.5 py-1.5 rounded text-xs font-bold uppercase ${statusBadge(unit.approvalStatus)}`}>
                {unit.approvalStatus}
              </div>
            </div>
          </div>

          {/* Caption */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Caption</h3>
            <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{unit.caption}</p>

            {/* Hashtags */}
            {unit.hashtags && unit.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {unit.hashtags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* NC Score */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">NC Score</h3>
            <div className={`text-3xl font-bold px-4 py-3 rounded-xl text-center ${scoreColor(unit.ncScore)}`}>
              {(unit.ncScore * 100).toFixed(0)}%
            </div>

            {/* Score breakdown */}
            {breakdownEntries.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  {showBreakdown ? 'Hide' : 'Show'} breakdown
                </button>
                {showBreakdown && (
                  <div className="mt-3 space-y-2">
                    {breakdownEntries.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-900">{((value as number) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lineage */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lineage</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fragment ID</span>
                <span className="font-mono text-gray-700 text-xs">{unit.fragmentId?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Content ID</span>
                <span className="font-mono text-gray-700 text-xs">{unit.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Media Type</span>
                <span className="text-gray-700">{unit.mediaType}</span>
              </div>
              {unit.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-700">{new Date(unit.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Re-generate */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</h3>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full px-4 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors min-h-[44px] disabled:opacity-50"
            >
              {regenerating ? 'Re-generating...' : 'Re-generate Content'}
            </button>
            <p className="text-xs text-gray-400 mt-2">Creates new content variants from the same source fragment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
