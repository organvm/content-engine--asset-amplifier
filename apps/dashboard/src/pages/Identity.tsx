import React, { useEffect, useState } from 'react';
import { identityService, NaturalCenter } from '../services/api.js';
import { useBrand } from '../services/BrandContext.js';
import RadarChart from '../components/RadarChart.js';

function confidenceScore(nc: Record<string, unknown>, key: string): number {
  const scores = nc.confidenceScores as Record<string, number> | undefined;
  const overall = (typeof nc.overallConfidence === 'number' ? nc.overallConfidence : 0.5);
  return scores?.[key] ?? overall;
}

export default function Identity() {
  const { brandId } = useBrand();
  const [nc, setNc] = useState<NaturalCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [deriving, setDeriving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedDim, setSelectedDim] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) { setLoading(false); return; }
    identityService.get(brandId)
      .then(setNc)
      .catch(() => setNc(null))
      .finally(() => setLoading(false));
  }, [brandId]);

  const handleDerive = async () => {
    if (!brandId) return;
    setDeriving(true);
    setError(null);
    try {
      await identityService.derive(brandId);
      setTimeout(async () => {
        try {
          const result = await identityService.get(brandId);
          setNc(result);
        } catch { setError('Derivation in progress — refresh in a moment.'); }
        setDeriving(false);
      }, 10000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setDeriving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-gray-400 p-4">Loading identity profile...</div>;

  if (!nc) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Brand Identity</h2>
          <p className="text-sm text-gray-500 mt-1">Natural Center — your brand's computable soul</p>
        </div>
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <div className="text-4xl mb-4 opacity-30">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <p className="text-gray-700 text-base font-semibold mb-2">No identity profile yet</p>
          <p className="text-gray-500 text-sm mb-6">Upload assets first, then derive your brand's Natural Center to ensure all content matches your identity.</p>
          <button
            onClick={handleDerive}
            disabled={deriving}
            className="inline-flex items-center px-6 py-3 bg-black text-white text-sm font-bold rounded-lg active:bg-gray-700 md:hover:bg-gray-800 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {deriving ? 'Deriving Identity...' : 'Derive Natural Center'}
          </button>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  const confidence = nc.overallConfidence ?? 0;
  const confColor = confidence > 0.7 ? 'text-green-600' : confidence > 0.4 ? 'text-yellow-600' : 'text-red-600';
  const confBg = confidence > 0.7 ? 'bg-green-50' : confidence > 0.4 ? 'bg-yellow-50' : 'bg-red-50';

  // Radar dimensions — map NC confidence scores to 5 spider axes
  const radarDimensions = [
    { key: 'thematic', label: 'Thematic', value: confidenceScore(nc, 'thematic') },
    { key: 'aesthetic', label: 'Aesthetic', value: confidenceScore(nc, 'aesthetic') },
    { key: 'tonal', label: 'Tonal', value: confidenceScore(nc, 'tonal') },
    { key: 'narrative', label: 'Narrative', value: confidenceScore(nc, 'narrative') },
    { key: 'symbolic', label: 'Symbolic', value: confidenceScore(nc, 'symbolic') },
  ];

  const dimensionCards = [
    { key: 'thematic', label: 'Thematic Core', raw: nc.thematicCore, type: 'object' as const },
    { key: 'aesthetic', label: 'Aesthetic Signature', raw: nc.aestheticSignature, type: 'text' as const },
    { key: 'tonal', label: 'Tonal Vector', raw: nc.tonalVector, type: 'text' as const },
    { key: 'narrative', label: 'Narrative Bias', raw: nc.narrativeBias, type: 'text' as const },
    { key: 'symbolic', label: 'Symbolic Markers', raw: nc.symbolicMarkers, type: 'pills' as const },
    { key: 'negative', label: 'Negative Space', raw: nc.negativeSpace, type: 'negative-pills' as const },
  ];

  const filteredDims = selectedDim
    ? dimensionCards.filter(d => d.key === selectedDim)
    : dimensionCards;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Brand Identity</h2>
          <p className="text-sm text-gray-500 mt-1">Natural Center v{nc.version}</p>
        </div>
        <div className={`self-start ${confBg} rounded-xl px-4 py-2`}>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Confidence</span>
          <span className={`text-lg font-bold ${confColor} ml-2`}>{(confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Radar chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identity Mirror</h3>
        <RadarChart
          dimensions={radarDimensions}
          selectedKey={selectedDim}
          onSelect={key => setSelectedDim(prev => prev === key ? null : key)}
        />
        <p className="text-xs text-gray-400 text-center mt-3">Tap a dimension to filter detail cards below</p>
      </div>

      {/* Dimension cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDims.map(dim => (
          <div
            key={dim.key}
            onClick={() => setSelectedDim(prev => prev === dim.key ? null : dim.key)}
            className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${
              selectedDim === dim.key ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{dim.label}</h3>
            {dim.type === 'text' && (
              <p className="text-sm text-gray-800">
                {typeof dim.raw === 'object' && dim.raw !== null ? JSON.stringify(dim.raw) : (dim.raw as string) || 'Not derived'}
              </p>
            )}
            {dim.type === 'object' && (
              <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto">
                {typeof dim.raw === 'object' && dim.raw !== null ? JSON.stringify(dim.raw, null, 2) : (dim.raw as string) || 'Not derived'}
              </pre>
            )}
            {dim.type === 'pills' && (
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(dim.raw) ? dim.raw : []).map((item: unknown, i: number) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                ))}
                {(!dim.raw || (Array.isArray(dim.raw) && dim.raw.length === 0)) && (
                  <span className="text-xs text-gray-400">None identified</span>
                )}
              </div>
            )}
            {dim.type === 'negative-pills' && (
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(dim.raw) ? dim.raw : []).map((item: unknown, i: number) => (
                  <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                ))}
                {(!dim.raw || (Array.isArray(dim.raw) && dim.raw.length === 0)) && (
                  <span className="text-xs text-gray-400">None identified</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* System Prompt */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="w-full flex items-center justify-between min-h-[44px]"
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">System Prompt</h3>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPrompt ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showPrompt && (
          <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 mt-2 overflow-x-auto whitespace-pre-wrap">
            {nc.systemPrompt || 'No system prompt compiled yet.'}
          </pre>
        )}
      </div>
    </div>
  );
}
