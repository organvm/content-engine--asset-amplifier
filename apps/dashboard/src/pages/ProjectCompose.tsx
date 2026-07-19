import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBrand } from '../services/BrandContext.js';
import { projectService, assetService, ArtworkProject, Asset } from '../services/api.js';

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

export default function ProjectCompose() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={e => setEditSubtitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canonical Essay</label>
                  <textarea
                    value={editEssay}
                    onChange={e => setEditEssay(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Write or paste the canonical essay..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artist Statement</label>
                  <textarea
                    value={editStatement}
                    onChange={e => setEditStatement(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Artist statement..."
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 min-h-[44px]"
                >
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
                <div>
                  <span className="text-gray-500">Hashtag title:</span>{' '}
                  <span className="font-medium">{project.hashtagTitle?.join(', ') || '\u2014'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Keywords:</span>{' '}
                  <span className="font-medium">{project.keywords?.join(', ') || '\u2014'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Source assets:</span>{' '}
                  <span className="font-medium">{project.sourceAssetIds?.length ?? 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Credits:</span>{' '}
                  <span className="font-medium">{(project.credits as unknown[])?.length ?? 0}</span>
                </div>
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

        {tab === 'application' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Linked Application</h2>
            <p className="text-sm text-gray-500">Connect an external application or instrument to this project.</p>
          </div>
        )}

        {tab === 'publications' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Publication Variants</h2>
            <p className="text-sm text-gray-500">Platform-native publication variants will be generated here.</p>
          </div>
        )}

        {tab === 'launch' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Launch</h2>
            <p className="text-sm text-gray-500">Calendar, dependencies, destination validation, and export/publish controls.</p>
          </div>
        )}

        {tab === 'funnel' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Conversion Funnel</h2>
            <p className="text-sm text-gray-500">Project-to-application conversion and outcome metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
