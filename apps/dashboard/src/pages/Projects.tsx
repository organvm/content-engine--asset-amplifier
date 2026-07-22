import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBrand } from '../services/BrandContext.js';
import { projectService, ArtworkProject } from '../services/api.js';

function statusBadge(status: string): string {
  switch (status) {
    case 'launched': return 'bg-green-100 text-green-700';
    case 'ready': return 'bg-blue-100 text-blue-700';
    case 'composing': return 'bg-amber-100 text-amber-700';
    case 'archived': return 'bg-gray-100 text-gray-500';
    default: return 'bg-yellow-100 text-yellow-700';
  }
}

export default function Projects() {
  const { brandId } = useBrand();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ArtworkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('artwork');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    projectService.list(brandId)
      .then(setProjects)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [brandId]);

  const handleCreate = async () => {
    if (!brandId || !newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const project = await projectService.create(brandId, {
        title: newTitle.trim(),
        projectType: newType,
      });
      setShowCreate(false);
      setNewTitle('');
      navigate(`/projects/${project.id}/compose`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading projects...</div>;
  if (error) return <div className="text-red-600 py-8">Error: {error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Compose artworks as coherent editorial projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          New Project
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Create Project</h2>
            <input
              type="text"
              placeholder="Project title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-black focus:outline-none"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-black focus:outline-none"
            >
              <option value="artwork">Artwork</option>
              <option value="instrument">Instrument</option>
              <option value="performance">Performance</option>
              <option value="series">Series</option>
              <option value="publication">Publication</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 min-h-[44px]"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No projects yet</p>
          <p className="text-sm">Create your first project to start composing</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}/compose`}
              className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{project.title}</h3>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge(project.status)}`}>
                  {project.status}
                </span>
              </div>
              {project.subtitle && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.subtitle}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="px-1.5 py-0.5 bg-gray-100 rounded">{project.projectType}</span>
                <span>{project.sourceAssetIds?.length ?? 0} assets</span>
                <span>&middot;</span>
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
