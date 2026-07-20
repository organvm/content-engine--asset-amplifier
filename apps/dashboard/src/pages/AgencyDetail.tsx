import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { agencyService, Agency, Brand } from '../services/api.js';

export default function AgencyDetail() {
  const { id } = useParams<{ id: string }>();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      agencyService.get(id),
      agencyService.listBrands(id),
    ])
      .then(([a, b]) => { setAgency(a); setBrands(b); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-500 py-8">Loading agency...</div>;
  if (error) return <div className="text-red-600 py-8">Error: {error}</div>;
  if (!agency) return <div className="text-gray-500 py-8">Agency not found</div>;

  const activeBrands = brands.filter(b => b.status === 'active');
  const pausedBrands = brands.filter(b => b.status === 'paused');
  const archivedBrands = brands.filter(b => b.status === 'archived');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/agencies" className="hover:text-gray-900">Agencies</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{agency.name}</span>
      </div>

      {/* Agency header */}
      <div className="flex items-start gap-4 mb-8">
        {agency.logoUrl ? (
          <img src={agency.logoUrl} alt={agency.name} className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white"
            style={{ backgroundColor: agency.primaryColor || '#374151' }}>
            {agency.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{agency.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{agency.contactEmail}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {agency.primaryColor && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agency.primaryColor }} />
                {agency.primaryColor}
              </span>
            )}
            <span>Slug: {agency.slug}</span>
            <span>Created {new Date(agency.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 block mb-1">Total Brands</span>
          <span className="text-2xl font-bold text-gray-900">{brands.length}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 block mb-1">Active</span>
          <span className="text-2xl font-bold text-green-600">{activeBrands.length}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 block mb-1">Paused</span>
          <span className="text-2xl font-bold text-yellow-600">{pausedBrands.length}</span>
        </div>
      </div>

      {/* Brand list */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Brands</h2>
        {brands.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-sm text-gray-400 mb-2">No brands under this agency yet.</p>
            <p className="text-xs text-gray-400">Create a brand and assign it to this agency from the Dashboard.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">Brand</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Threshold</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(b => (
                  <tr key={b.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{b.name}</span>
                        <span className="text-xs text-gray-400">{b.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        b.status === 'active' ? 'bg-green-100 text-green-700' :
                        b.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.consistencyThreshold}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* White-label report preview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">White-Label Report</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
            {agency.logoUrl ? (
              <img src={agency.logoUrl} alt={agency.name} className="h-8" />
            ) : (
              <span className="text-lg font-bold" style={{ color: agency.primaryColor || '#111827' }}>{agency.name}</span>
            )}
            <div className="text-right flex-1">
              <p className="text-xs text-gray-500">Content Engine Report</p>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Client Brands</span>
              <span className="font-medium">{brands.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active Brands</span>
              <span className="font-medium text-green-600">{activeBrands.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paused Brands</span>
              <span className="font-medium text-yellow-600">{pausedBrands.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Archived Brands</span>
              <span className="font-medium text-gray-400">{archivedBrands.length}</span>
            </div>
          </div>

          {brands.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">Full report with per-brand metrics, content output, and ROI data coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
