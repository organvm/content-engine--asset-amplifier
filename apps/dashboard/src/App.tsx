import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandProvider, useBrand } from './services/BrandContext.js';
import ReviewQueue from './pages/ReviewQueue.js';
import Settings from './pages/Settings.js';
import Dashboard from './pages/Dashboard.js';
import Assets from './pages/Assets.js';
import AssetRoiPage from './pages/AssetRoi.js';
import DesignResize from './pages/DesignResize.js';
import ContentDetail from './pages/ContentDetail.js';
import Projects from './pages/Projects.js';
import ProjectCompose from './pages/ProjectCompose.js';
import Calendar from './pages/Calendar.js';
import Identity from './pages/Identity.js';
import Pricing from './pages/Pricing.js';
import CheckoutSuccess from './pages/CheckoutSuccess.js';
import CheckoutCancel from './pages/CheckoutCancel.js';
import Agencies from './pages/Agencies.js';
import AgencyDetail from './pages/AgencyDetail.js';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/assets', label: 'Assets', icon: 'assets' },
  { path: '/projects', label: 'Projects', icon: 'projects' },
  { path: '/review', label: 'Review', icon: 'review' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

const allNavItems = [
  ...navItems.slice(0, 4),
  { path: '/identity', label: 'Brand Identity', icon: 'identity' },
  { path: '/agencies', label: 'Agencies', icon: 'agencies' },
  navItems[4],
];

/** SVG icons sized for 24x24 viewBox, touch-safe containers */
const NavIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = '' }) => {
  const shared = `w-6 h-6 ${className}`;
  switch (icon) {
    case 'home':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case 'assets':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      );
    case 'review':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'identity':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      );
    case 'projects':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
    case 'agencies':
      return (
        <svg className={shared} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'https://cronus-api.ivixivi.workers.dev';

type UploadPhase = 'idle' | 'uploading' | 'generating';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { brands, selectedBrand, brandId, loading: brandLoading, selectBrand } = useBrand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !brandId) return;

    setUploadPhase('uploading');
    try {
      const form = new FormData();
      form.append('file', file);

      setUploadPhase('generating');
      const res = await fetch(`${API_URL}/api/v1/brands/${brandId}/assets`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const asset = await res.json();

      const count = asset.contentGenerated || 0;
      showToast(
        count > 0
          ? `${asset.originalFilename} → ${count} content units generated across 5 platforms`
          : `Uploaded ${asset.originalFilename} — content generation pending`,
        'success',
      );

      // Brief delay so the user reads the toast before navigation
      setTimeout(() => navigate('/review'), 1200);
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadPhase('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /** Label for the desktop upload button based on current phase */
  const uploadButtonLabel = (): string => {
    switch (uploadPhase) {
      case 'uploading':
        return 'Uploading...';
      case 'generating':
        return 'Generating content...';
      default:
        return 'Upload Asset';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* ── Toast notification ── */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="px-2">
              <h1 className="text-xl font-bold tracking-tight">Cronus</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Metabolus</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              )}
            </svg>
          </button>
        </div>
        <nav className="mt-2 px-2 space-y-1 flex-1">
          {allNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
                location.pathname === item.path
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <NavIcon icon={item.icon} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Padavano &times; Lefler Design</p>
          </div>
        )}
      </aside>

      {/* ── Mobile slide-over menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <h1 className="text-lg font-bold tracking-tight">Cronus</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Metabolus</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 active:bg-gray-100"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {allNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors min-h-[44px] ${
                    location.pathname === item.path
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 active:bg-gray-50 active:text-gray-900'
                  }`}
                >
                  <NavIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Padavano &times; Lefler Design</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          {/* Mobile: brand + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <h1 className="text-base font-bold tracking-tight">Cronus</h1>
          </div>
          {/* Desktop: brand selector */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-500">Brand:</span>
            {brandLoading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : brands.length === 0 ? (
              <span className="text-sm text-gray-400">No brands</span>
            ) : (
              <select
                value={brandId ?? ''}
                onChange={e => selectBrand(e.target.value)}
                className="text-sm border-none bg-transparent font-semibold focus:ring-0 cursor-pointer"
              >
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,image/png,image/jpeg,image/tiff"
              onChange={handleUpload}
              className="hidden"
            />
            {/* Upload button: icon on mobile, full on desktop */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhase !== 'idle'}
              className="hidden md:inline-flex px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors min-h-[44px] items-center disabled:opacity-50"
            >
              {uploadButtonLabel()}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhase !== 'idle'}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center bg-black text-white rounded-lg active:bg-gray-800 disabled:opacity-50"
              aria-label="Upload Asset"
            >
              {uploadPhase !== 'idle' ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-600 active:bg-gray-100"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page content: bottom padding on mobile for bottom nav clearance */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-1 md:hidden z-50 safe-area-bottom">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-1 py-1 rounded-lg transition-colors ${
                active ? 'text-gray-900' : 'text-gray-400 active:text-gray-700'
              }`}
            >
              <NavIcon icon={item.icon} className={active ? 'text-gray-900' : ''} />
              <span className={`text-[10px] font-medium ${active ? 'text-gray-900' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

// Calendar and Identity are now full components imported above

export default function App() {
  return (
    <BrandProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/roi" element={<AssetRoiPage />} />
          <Route path="/resize" element={<DesignResize />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id/compose" element={<ProjectCompose />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/identity" element={<Identity />} />
          <Route path="/agencies" element={<Agencies />} />
          <Route path="/agencies/:id" element={<AgencyDetail />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/billing/success" element={<CheckoutSuccess />} />
          <Route path="/billing/cancel" element={<CheckoutCancel />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrandProvider>
  );
}
