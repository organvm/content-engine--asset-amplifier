import React, { useEffect, useState, useRef } from 'react';
import { useBrand } from '../services/BrandContext.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ResizeFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  platform: string;
  description: string;
}

const FORMATS: ResizeFormat[] = [
  { id: 'instagram_feed_1080x1080', name: 'Instagram Feed', width: 1080, height: 1080, platform: 'instagram', description: '1080×1080 square' },
  { id: 'instagram_story_1080x1920', name: 'Instagram Story', width: 1080, height: 1920, platform: 'instagram', description: '1080×1920 vertical' },
  { id: 'facebook_feed_1200x628', name: 'Facebook Feed', width: 1200, height: 628, platform: 'facebook', description: '1200×628 landscape' },
  { id: 'linkedin_1200x627', name: 'LinkedIn', width: 1200, height: 627, platform: 'linkedin', description: '1200×627 landscape' },
  { id: 'x_1600x900', name: 'X (Twitter)', width: 1600, height: 900, platform: 'x', description: '1600×900 landscape' },
  { id: 'youtube_thumb_1280x720', name: 'YouTube Thumbnail', width: 1280, height: 720, platform: 'youtube', description: '1280×720 landscape' },
  { id: 'display_300x250', name: 'Display Med Rect', width: 300, height: 250, platform: 'google', description: '300×250 ad' },
  { id: 'display_728x90', name: 'Display Leaderboard', width: 728, height: 90, platform: 'google', description: '728×90 banner' },
  { id: 'display_160x600', name: 'Display Skyscraper', width: 160, height: 600, platform: 'google', description: '160×600 sidebar' },
];

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  linkedin: 'bg-blue-100 text-blue-800',
  x: 'bg-gray-100 text-gray-700',
  youtube: 'bg-red-100 text-red-700',
  google: 'bg-green-100 text-green-700',
};

export default function DesignResize() {
  const { brandId } = useBrand();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    'instagram_feed_1080x1080', 'instagram_story_1080x1920', 'facebook_feed_1200x628',
  ]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<{ formatId: string; storageKey: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleFormat = (id: string) => {
    setSelectedFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id],
    );
  };

  const selectAll = () => setSelectedFormats(FORMATS.map(f => f.id));
  const selectNone = () => setSelectedFormats([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResults([]);
    setError(null);
  };

  const handleResize = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !brandId || selectedFormats.length === 0) return;

    setUploading(true);
    setError(null);
    setResults([]);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('target_formats', selectedFormats.join(','));

      const res = await fetch(`${API_URL}/api/v1/brands/${brandId}/resize`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setResults(data.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Resize failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Design Resize</h2>
        <p className="text-sm text-gray-500 mt-1">Upload one design, get format variants for all platforms</p>
      </div>

      {/* Upload area */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Source Design</h3>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/tiff"
          onChange={handleFile}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={preview} alt="Preview" className="max-h-80 object-contain" />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-blue-600 hover:underline"
            >
              Choose different file
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <span className="text-sm font-medium">Click to upload PNG, JPG, or TIFF</span>
            <span className="text-xs text-gray-400">Recommended: 1080×1080 or larger</span>
          </button>
        )}
      </div>

      {/* Target formats */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Target Formats ({selectedFormats.length} selected)
          </h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Select All</button>
            <button onClick={selectNone} className="text-xs text-gray-500 hover:underline">None</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FORMATS.map(fmt => {
            const selected = selectedFormats.includes(fmt.id);
            return (
              <button
                key={fmt.id}
                onClick={() => toggleFormat(fmt.id)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  selected
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${platformColors[fmt.platform] || 'bg-gray-100 text-gray-600'}`}>
                    {fmt.platform}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{fmt.name}</span>
                </div>
                <div className="text-xs text-gray-500">{fmt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resize button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleResize}
          disabled={uploading || !preview || selectedFormats.length === 0}
          className="px-6 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors min-h-[44px] disabled:opacity-50"
        >
          {uploading ? 'Resizing...' : `Generate ${selectedFormats.length} Variant${selectedFormats.length !== 1 ? 's' : ''}`}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Generated Variants ({results.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(r => {
              const fmt = FORMATS.find(f => f.id === r.formatId);
              return (
                <div key={r.formatId} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={`${API_URL}/files/${r.storageKey}`}
                      alt={fmt?.name || r.formatId}
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900">{fmt?.name || r.formatId}</div>
                    <div className="text-xs text-gray-500">{fmt?.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !uploading && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">Upload a design and select formats to generate variants.</p>
        </div>
      )}
    </div>
  );
}
