import { useEffect, useLayoutEffect, useState } from 'react';
import { Building2, Check, ChevronDown, Link2, Moon, Palette, PenLine, Rows3, Sun } from 'lucide-react';
import { getBrands } from './api';
import Dashboard from './components/Dashboard';
import BrandSettings from './components/BrandSettings';
import GeneratePost from './components/GeneratePost';
import SocialAccounts from './components/SocialAccounts';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [brands, setBrands] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const tabs = [
    { id: 'dashboard', label: 'Posts', icon: Rows3 },
    { id: 'generate', label: 'Generate', icon: PenLine },
    { id: 'social', label: 'Social', icon: Link2 },
    { id: 'brand', label: 'Businesses', icon: Palette },
  ];

  const selectedBrand = brands.find(brand => String(brand.id) === String(selectedBrandId)) || null;

  const loadBrands = async (preferredId) => {
    try {
      const res = await getBrands();
      setBrands(res.data);
      if (res.data.length === 0) {
        setSelectedBrandId('');
        return;
      }

      const nextId = preferredId || selectedBrandId;
      const hasNext = res.data.some(brand => String(brand.id) === String(nextId));
      setSelectedBrandId(hasNext ? String(nextId) : String(res.data[0].id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const applyTheme = (nextTheme) => {
    const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', normalizedTheme === 'dark');
    document.documentElement.classList.toggle('light', normalizedTheme === 'light');
    document.documentElement.dataset.theme = normalizedTheme;
    document.documentElement.style.colorScheme = normalizedTheme;
    localStorage.setItem('theme', normalizedTheme);
    setTheme(normalizedTheme);
  };

  useLayoutEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,#0f172a,#1e293b_55%,#064e3b)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.12),transparent_30%),linear-gradient(135deg,#020617,#0f172a_55%,#042f2e)]" />
      <div className="relative">
        <header className="px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-lg bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
                <Building2 size={22} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-normal text-white">Social AI Automation</h1>
                <p className="text-sm text-cyan-50/75">Multi-business content command center</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:min-w-72">
                <button
                  type="button"
                  onClick={() => setBrandMenuOpen(open => !open)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg bg-white/95 px-3 text-left text-sm font-medium text-slate-950 shadow-sm outline-none ring-1 ring-white/30 transition hover:bg-white focus:ring-4 focus:ring-teal-200/40 dark:bg-slate-900/95 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-900"
                >
                  <span className="truncate">{selectedBrand?.company_name || 'No businesses yet'}</span>
                  <ChevronDown
                    className={`shrink-0 text-slate-500 transition dark:text-slate-400 ${brandMenuOpen ? 'rotate-180' : ''}`}
                    size={16}
                    aria-hidden="true"
                  />
                </button>

                {brandMenuOpen && (
                  <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-white/20 bg-white/95 p-1 shadow-2xl shadow-slate-950/25 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                    {brands.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">No businesses yet</div>
                    ) : (
                      brands.map(brand => {
                        const selected = String(brand.id) === String(selectedBrandId);
                        return (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => {
                              setSelectedBrandId(String(brand.id));
                              setBrandMenuOpen(false);
                            }}
                            className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition ${
                              selected
                                ? 'bg-teal-600 text-white'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`}
                          >
                            <span className="truncate">{brand.company_name}</span>
                            {selected && <Check size={16} aria-hidden="true" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => applyTheme(isDark ? 'light' : 'dark')}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium ring-1 backdrop-blur transition focus:outline-none focus:ring-4 focus:ring-teal-200/30 ${
                  isDark
                    ? 'bg-white text-slate-950 ring-white/30 hover:bg-slate-100'
                    : 'bg-white/10 text-white ring-white/15 hover:bg-white/15'
                }`}
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDark ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
                <span className="hidden sm:inline">{isDark ? 'Dark' : 'Light'}</span>
              </button>

              <nav className="flex w-full gap-2 overflow-x-auto rounded-lg bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur sm:w-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition ${
                        activeTab === tab.id
                          ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-100 dark:text-slate-950'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6">
          <div className="mb-7 max-w-3xl text-white">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-200">Content Studio</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-5xl">
              Manage every business, page, and brand voice from one workspace.
            </h2>
          </div>

          <div className="rounded-lg border border-white/70 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30 sm:p-6">
            {activeTab === 'dashboard' && <Dashboard brand={selectedBrand} />}
            {activeTab === 'generate' && <GeneratePost brand={selectedBrand} />}
            {activeTab === 'social' && <SocialAccounts brand={selectedBrand} />}
            {activeTab === 'brand' && (
              <BrandSettings
                brands={brands}
                selectedBrand={selectedBrand}
                onSelectBrand={brandId => setSelectedBrandId(String(brandId))}
                onBrandsChange={loadBrands}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
