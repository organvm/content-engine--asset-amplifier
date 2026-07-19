import React, { useEffect, useState } from 'react';
import { brandService, contentService } from '../services/api.js';
import { ContentUnit } from '@cronus/domain';

const API_URL = import.meta.env.VITE_API_URL || 'https://cronus-api.ivixivi.workers.dev';

const platformColors: Record<string, string> = {
  instagram_feed: 'bg-pink-100 text-pink-700',
  instagram_story: 'bg-purple-100 text-purple-700',
  instagram_reels: 'bg-fuchsia-100 text-fuchsia-700',
  linkedin: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-gray-900 text-white',
  youtube_shorts: 'bg-red-100 text-red-700',
  x: 'bg-gray-100 text-gray-700',
};

const approvalColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  flagged: 'bg-orange-100 text-orange-700',
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function isToday(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function groupByDay(items: ContentUnit[]): Record<string, ContentUnit[]> {
  const groups: Record<string, ContentUnit[]> = {};
  for (const item of items) {
    const key = new Date(item.createdAt).toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export default function Calendar() {
  const [content, setContent] = useState<ContentUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    brandService.list().then(brands => {
      if (brands.length === 0) { setLoading(false); return; }
      contentService.list(brands[0].id)
        .then(setContent)
        .catch(() => setContent([]))
        .finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-gray-400 p-4">Loading calendar...</div>;

  const filtered = filter === 'all'
    ? content
    : content.filter((u) => u.approvalStatus === filter);

  const grouped = groupByDay(filtered);
  const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Content Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">{content.length} content unit{content.length !== 1 ? 's' : ''} generated</p>
        </div>
        <div className="flex gap-2 self-start">
          {(['all', 'approved', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full min-h-[36px] transition-colors capitalize ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200 md:hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content feed grouped by day */}
      {sortedDays.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <div className="mb-3">
            <svg className="w-10 h-10 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="text-gray-500 text-base mb-2">No content yet.</p>
          <p className="text-xs text-gray-400">Upload an asset and generate content to populate your calendar.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map(day => (
            <div key={day}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-sm font-semibold ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>
                  {isToday(day) ? 'Today' : formatDate(day)}
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">{grouped[day].length} unit{grouped[day].length !== 1 ? 's' : ''}</span>
              </div>

              {/* Content cards for the day */}
              <div className="space-y-3">
                {grouped[day].map((unit) => (
                  <div key={unit.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                    {/* Thumbnail */}
                    {unit.mediaKey ? (
                      <img
                        src={`${API_URL}/files/${unit.mediaKey}`}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          platformColors[unit.platform] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {unit.platform?.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          approvalColors[unit.approvalStatus] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {unit.approvalStatus}
                        </span>
                        {unit.ncScore != null && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            NC {(unit.ncScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{unit.caption}</p>
                      {unit.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {unit.hashtags.slice(0, 4).map((tag: string) => (
                            <span key={tag} className="text-[11px] text-gray-400">#{tag}</span>
                          ))}
                          {unit.hashtags.length > 4 && (
                            <span className="text-[11px] text-gray-300">+{unit.hashtags.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
