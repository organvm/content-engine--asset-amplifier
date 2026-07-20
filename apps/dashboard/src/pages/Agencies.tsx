import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agencyService, Agency } from '../services/api.js';

export default function Agencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', contactEmail: '', primaryColor: '' });
  const [saving, setSaving] = useState(false);

  const load = () => agencyService.list().then(setAgencies).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await agencyService.create({
        name: form.name,
        contactEmail: form.contactEmail,
        primaryColor: form.primaryColor || undefined,
      });
      setForm({ name: '', contactEmail: '', primaryColor: '' });
      setShowCreate(false);
      await load();
    } finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading agencies...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agencies</h1>
          <p className="text-sm text-gray-500 mt-1">Multi-client management with isolated brands and aggregate metrics.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 min-h-[44px]">
          {showCreate ? 'Cancel' : '+ New Agency'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agency Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Acme Creative" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="hello@acme.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Brand Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.primaryColor || '#000000'}
                  onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="#000000" />
              </div>
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving || !form.name || !form.contactEmail}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 min-h-[44px]">
            {saving ? 'Creating...' : 'Create Agency'}
          </button>
        </div>
      )}

      {agencies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">No agencies yet. Create one to start managing multiple client brands.</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 min-h-[44px]">
            + Create First Agency
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencies.map(a => (
            <Link key={a.id} to={`/agencies/${a.id}`}
              className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                {a.logoUrl ? (
                  <img src={a.logoUrl} alt={a.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: a.primaryColor || '#374151' }}>
                    {a.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{a.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{a.contactEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {a.primaryColor && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.primaryColor }} />
                    Brand color
                  </span>
                )}
                <span>Created {new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
