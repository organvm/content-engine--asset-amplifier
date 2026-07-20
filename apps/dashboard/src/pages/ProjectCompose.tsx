import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBrand } from '../services/BrandContext.js';
import {
  projectService, assetService, variantService, linkedAppService, conversionEventService,
  ArtworkProject, Asset, PublicationVariant, LinkedApplication, ConversionEvent, FunnelBucket,
} from '../services/api.js';

type Tab = 'package' | 'visuals' | 'writing' | 'application' | 'publications' | 'launch' | 'funnel';

const TABS: { key: Tab; label: string }[] = [
  { key: 'package', label: 'Package' },
  { key: 'visuals', label: 'Visuals' },
  { key: 'writing', label: 'Writing' },
  { key: 'application', label: 'Application' },
  { key: 'publications', label: 'Publications' },
  { key: 'launch', label: 'Launch' },
  { key: 'funnel', label: 'Funnel' },
];

const PLATFORMS = ['instagram_feed', 'instagram_reels', 'instagram_story', 'linkedin', 'x', 'tiktok', 'youtube_shorts'];
const FORMATS = ['single', 'carousel', 'reel', 'story', 'thread', 'article'];
const EDITORIAL_ROLES = ['seed', 'story', 'influence', 'process', 'instrument', 'participant'];
const APP_TYPES = ['interactive', 'generator', 'download', 'stream', 'archive', 'other'];

function completeness(project: ArtworkProject): { pct: number; items: { label: string; done: boolean }[] } {
  const items = [
    { label: 'Title', done: !!project.title },
    { label: 'Subtitle', done: !!project.subtitle },
    { label: 'Hashtag title', done: (project.hashtagTitle?.length ?? 0) > 0 },
    { label: 'Source assets', done: (project.sourceAssetIds?.length ?? 0) > 0 },
    { label: 'Canonical essay', done: !!project.canonicalEssay },
    { label: 'Artist statement', done: !!project.artistStatement },
    { label: 'Keywords', done: (project.keywords?.length ?? 0) > 0 },
    { label: 'Credits', done: (project.credits?.length ?? 0) > 0 },
  ];
  const done = items.filter(i => i.done).length;
  return { pct: Math.round((done / items.length) * 100), items };
}

// ─── Publications Tab ────────────────────────────────────────────────────────
function PublicationsTab({ brandId, projectId }: { brandId: string; projectId: string }) {
  const [variants, setVariants] = useState<PublicationVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ platform: 'instagram_feed', caption: '', format: 'single', editorialRole: 'seed' });
  const [saving, setSaving] = useState(false);

  const load = () => variantService.list(brandId, projectId).then(setVariants).finally(() => setLoading(false));
  useEffect(() => { load(); }, [brandId, projectId]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await variantService.create(brandId, projectId, form);
      setForm({ platform: 'instagram_feed', caption: '', format: 'single', editorialRole: 'seed' });
      setShowCreate(false);
      await load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Delete this variant?')) return;
    await variantService.remove(brandId, projectId, variantId);
    await load();
  };

  if (loading) return <div className="text-sm text-gray-500">Loading variants...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Publication Variants</h2>
          <p className="text-sm text-gray-500">Platform-native compositions for this project.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 min-h-[44px]">
          {showCreate ? 'Cancel' : '+ New Variant'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
              <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Editorial Role</label>
              <select value={form.editorialRole} onChange={e => setForm(f => ({ ...f, editorialRole: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {EDITORIAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
            <textarea value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Write the caption for this variant..." />
          </div>
          <button onClick={handleCreate} disabled={saving || !form.caption}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 min-h-[44px]">
            {saving ? 'Creating...' : 'Create Variant'}
          </button>
        </div>
      )}

      {variants.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No variants yet. Create one to compose platform-specific content.</p>
      ) : (
        <div className="space-y-3">
          {variants.map(v => (
            <div key={v.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full font-medium">{v.platform}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{v.format}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : v.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {v.approvalStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{v.caption}</p>
                {v.headline && <p className="text-xs text-gray-500 mt-1">Headline: {v.headline}</p>}
              </div>
              <div className="flex gap-1 ml-3">
                {v.approvalStatus !== 'approved' && (
                  <button onClick={async () => { await variantService.update(brandId, projectId, v.id, { approval_status: 'approved' }); await load(); }}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 min-h-[32px]">Approve</button>
                )}
                <button onClick={() => handleDelete(v.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 min-h-[32px]">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Application Tab ─────────────────────────────────────────────────────────
function ApplicationTab({ brandId, projectId }: { brandId: string; projectId: string }) {
  const [app, setApp] = useState<LinkedApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ url: '', ctaLabel: '', type: 'other', privacy: 'public' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    linkedAppService.get(brandId, projectId).then(a => {
      setApp(a);
      if (a) setForm({ url: a.url, ctaLabel: a.ctaLabel, type: a.type, privacy: a.privacy });
    }).finally(() => setLoading(false));
  }, [brandId, projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (app) {
        const updated = await linkedAppService.update(brandId, projectId, app.id, form);
        setApp(updated);
      } else {
        const created = await linkedAppService.create(brandId, projectId, form);
        setApp(created);
      }
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!app || !confirm('Remove linked application?')) return;
    await linkedAppService.remove(brandId, projectId, app.id);
    setApp(null);
    setEditing(false);
    setForm({ url: '', ctaLabel: '', type: 'other', privacy: 'public' });
  };

  if (loading) return <div className="text-sm text-gray-500">Loading application...</div>;

  const healthColor: Record<string, string> = {
    healthy: 'bg-green-100 text-green-700',
    degraded: 'bg-yellow-100 text-yellow-700',
    offline: 'bg-red-100 text-red-700',
    unknown: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Linked Application</h2>
      <p className="text-sm text-gray-500 mb-4">Connect an external application, instrument, or landing page to this project.</p>

      {!app && !editing ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-4">No linked application yet.</p>
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 min-h-[44px]">
            + Link Application
          </button>
        </div>
      ) : editing ? (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CTA Label</label>
              <input type="text" value={form.ctaLabel} onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Explore" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Privacy</label>
              <select value={form.privacy} onChange={e => setForm(f => ({ ...f, privacy: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.url || !form.ctaLabel}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 min-h-[44px]">
              {saving ? 'Saving...' : app ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setEditing(false); if (app) setForm({ url: app.url, ctaLabel: app.ctaLabel, type: app.type, privacy: app.privacy }); }}
              className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 min-h-[44px]">Cancel</button>
            {app && <button onClick={handleDelete} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 min-h-[44px]">Remove</button>}
          </div>
        </div>
      ) : app && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${healthColor[app.healthStatus] ?? healthColor.unknown}`}>{app.healthStatus}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">{app.type}</span>
                <span className="text-xs text-gray-500">{app.privacy}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{app.url}</p>
              <p className="text-xs text-gray-500 mt-1">CTA: {app.ctaLabel}</p>
              {app.campaignKey && <p className="text-xs text-gray-500">Campaign: {app.campaignKey}</p>}
            </div>
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 min-h-[36px]">Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Launch Tab ──────────────────────────────────────────────────────────────
function LaunchTab({ project, onStatusChange }: { project: ArtworkProject; onStatusChange: (s: string) => void }) {
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Launch</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Status</span>
            <span className="text-sm font-semibold capitalize">{project.status}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Type</span>
            <span className="text-sm font-semibold">{project.projectType}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Created</span>
            <span className="text-sm font-medium">{formatDate(project.createdAt)}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Last Updated</span>
            <span className="text-sm font-medium">{formatDate(project.updatedAt)}</span>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 block mb-2">Destination</span>
          {project.canonicalUrl ? (
            <a href={project.canonicalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{project.canonicalUrl}</a>
          ) : (
            <span className="text-sm text-gray-400">No canonical URL set</span>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 block mb-2">Quick Actions</span>
          <div className="flex gap-2 flex-wrap">
            {project.status === 'draft' && (
              <button onClick={() => onStatusChange('composing')} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 min-h-[36px]">Start Composing</button>
            )}
            {project.status === 'composing' && (
              <button onClick={() => onStatusChange('ready')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 min-h-[36px]">Mark Ready</button>
            )}
            {project.status === 'ready' && (
              <button onClick={() => onStatusChange('launched')} className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 min-h-[36px]">Launch</button>
            )}
            {project.status === 'launched' && (
              <button onClick={() => onStatusChange('archived')} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 min-h-[36px]">Archive</button>
            )}
          </div>
        </div>

        {project.status === 'ready' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">Ready to launch</p>
            <p className="text-xs text-yellow-700 mt-1">All publication variants are approved and the application is configured. Click "Launch" to go live.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Funnel Tab ──────────────────────────────────────────────────────────────
const FUNNEL_LABELS: Record<string, string> = {
  project_view: 'Project Views',
  essay_open: 'Essay Opens',
  application_open: 'App Opens',
  application_start: 'App Starts',
  application_complete: 'App Completions',
  download: 'Downloads',
  share: 'Shares',
  relay_invite: 'Relay Invites',
  relay_complete: 'Relay Completions',
  follow_intent: 'Follow Intent',
};
const FUNNEL_ORDER = ['project_view', 'essay_open', 'application_open', 'application_start', 'application_complete', 'download', 'share', 'relay_invite', 'relay_complete', 'follow_intent'];

function FunnelTab({ brandId, projectId }: { brandId: string; projectId: string }) {
  const [funnel, setFunnel] = useState<FunnelBucket[]>([]);
  const [events, setEvents] = useState<ConversionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      conversionEventService.funnel(brandId, projectId),
      conversionEventService.list(brandId, projectId),
    ]).then(([f, e]) => { setFunnel(f); setEvents(e); })
      .finally(() => setLoading(false));
  }, [brandId, projectId]);

  if (loading) return <div className="text-sm text-gray-500">Loading funnel...</div>;

  const counts = new Map(funnel.map(b => [b.event_type, b.count]));
  const maxCount = Math.max(1, ...funnel.map(b => b.count));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Conversion Funnel</h2>
      <p className="text-sm text-gray-500 mb-4">Project-to-application conversion and outcome metrics.</p>

      {funnel.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No conversion events recorded yet. Events are ingested via the tracking endpoint.</p>
      ) : (
        <div className="space-y-2 mb-6">
          {FUNNEL_ORDER.filter(k => counts.has(k)).map(key => {
            const count = counts.get(key)!;
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-32 text-right shrink-0">{FUNNEL_LABELS[key] ?? key}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div className="bg-black h-5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono text-gray-700 w-10 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Events</h3>
      {events.length === 0 ? (
        <p className="text-xs text-gray-400">No events.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Session</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 20).map(ev => (
                <tr key={ev.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium">{FUNNEL_LABELS[ev.eventType] ?? ev.eventType}</td>
                  <td className="py-2 pr-4 text-gray-500 font-mono">{ev.anonymousSessionId.slice(0, 8)}</td>
                  <td className="py-2 pr-4 text-gray-500">{ev.source ?? '—'}{ev.medium ? ` / ${ev.medium}` : ''}</td>
                  <td className="py-2 text-gray-500">{new Date(ev.occurredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProjectCompose() {
  const { id } = useParams<{ id: string }>();

  const { brandId } = useBrand();
  const [project, setProject] = useState<ArtworkProject | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('package');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editEssay, setEditEssay] = useState('');
  const [editStatement, setEditStatement] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!brandId || !id) return;
    Promise.all([
      projectService.get(brandId, id),
      assetService.list(brandId),
    ])
      .then(([p, a]) => {
        setProject(p);
        setAssets(a);
        setEditTitle(p.title);
        setEditSubtitle(p.subtitle ?? '');
        setEditEssay(p.canonicalEssay ?? '');
        setEditStatement(p.artistStatement ?? '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [brandId, id]);

  const handleSave = async () => {
    if (!brandId || !id) return;
    setSaving(true);
    try {
      const updated = await projectService.update(brandId, id, {
        title: editTitle,
        subtitle: editSubtitle || null,
        canonicalEssay: editEssay || null,
        artistStatement: editStatement || null,
      });
      setProject(updated);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!brandId || !id) return;
    try {
      const updated = await projectService.update(brandId, id, { status });
      setProject(updated);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading project...</div>;
  if (error) return <div className="text-red-600 py-8">Error: {error}</div>;
  if (!project) return <div className="text-gray-500 py-8">Project not found</div>;

  const comp = completeness(project);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/projects" className="hover:text-gray-900">Projects</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{project.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            {project.subtitle && <p className="text-sm text-gray-500 mt-1">{project.subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={project.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none min-h-[44px]"
            >
              <option value="draft">Draft</option>
              <option value="composing">Composing</option>
              <option value="ready">Ready</option>
              <option value="launched">Launched</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px]"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Completeness bar */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completeness</span>
          <span className="text-sm text-gray-500">{comp.pct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div className="bg-black rounded-full h-2 transition-all" style={{ width: `${comp.pct}%` }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {comp.items.map(item => (
            <span key={item.label} className={`text-xs px-2 py-1 rounded-full ${item.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {item.done ? '\u2713' : '\u25CB'} {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
        {tab === 'package' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Canonical Package</h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input type="text" value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canonical Essay</label>
                  <textarea value={editEssay} onChange={e => setEditEssay(e.target.value)} rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Write or paste the canonical essay..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artist Statement</label>
                  <textarea value={editStatement} onChange={e => setEditStatement(e.target.value)} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Artist statement..." />
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 min-h-[44px]">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>{' '}
                  <span className="font-medium">{project.projectType}</span>
                </div>
                {project.canonicalEssay && (
                  <div>
                    <span className="text-gray-500 block mb-1">Canonical Essay:</span>
                    <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded-lg">{project.canonicalEssay}</div>
                  </div>
                )}
                {project.artistStatement && (
                  <div>
                    <span className="text-gray-500 block mb-1">Artist Statement:</span>
                    <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded-lg">{project.artistStatement}</div>
                  </div>
                )}
                <div><span className="text-gray-500">Hashtag title:</span> <span className="font-medium">{project.hashtagTitle?.join(', ') || '\u2014'}</span></div>
                <div><span className="text-gray-500">Keywords:</span> <span className="font-medium">{project.keywords?.join(', ') || '\u2014'}</span></div>
                <div><span className="text-gray-500">Source assets:</span> <span className="font-medium">{project.sourceAssetIds?.length ?? 0}</span></div>
                <div><span className="text-gray-500">Credits:</span> <span className="font-medium">{(project.credits as unknown[])?.length ?? 0}</span></div>
              </div>
            )}
          </div>
        )}

        {tab === 'visuals' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Visual Composition</h2>
            <p className="text-sm text-gray-500 mb-4">Source assets attached to this project</p>
            {project.sourceAssetIds?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {project.sourceAssetIds.map(assetId => {
                  const asset = assets.find(a => a.id === assetId);
                  return (
                    <div key={assetId} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      {asset?.originalFilename ?? assetId.slice(0, 8)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No source assets attached yet. Upload assets from the Assets page and attach them here.</p>
            )}
          </div>
        )}

        {tab === 'writing' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Writing</h2>
            <p className="text-sm text-gray-500">Canonical essay, statement, and derived captions will appear here.</p>
          </div>
        )}

        {tab === 'application' && brandId && id && (
          <ApplicationTab brandId={brandId} projectId={id} />
        )}

        {tab === 'publications' && brandId && id && (
          <PublicationsTab brandId={brandId} projectId={id} />
        )}

        {tab === 'launch' && (
          <LaunchTab project={project} onStatusChange={handleStatusChange} />
        )}

        {tab === 'funnel' && brandId && id && (
          <FunnelTab brandId={brandId} projectId={id} />
        )}
      </div>
    </div>
  );
}
