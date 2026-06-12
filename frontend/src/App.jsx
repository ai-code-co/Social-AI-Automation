import { useEffect, useLayoutEffect, useState } from 'react';
import { BarChart3, CalendarDays, Check, ChevronDown, Link2, LogOut, Moon, Palette, PenLine, Rows3, Sun, Trash2, UserRound } from 'lucide-react';
import { clearAuthSession, deleteCurrentUser, getBrands, getCurrentUser, getStoredToken, getStoredUser } from './api';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import BrandSettings from './components/BrandSettings';
import GeneratePost from './components/GeneratePost';
import SocialAccounts from './components/SocialAccounts';
import Calendar from './components/Calendar';
import Performance from './components/Performance';

const syncDocumentTheme = (nextTheme) => {
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  document.documentElement.classList.toggle('light', nextTheme === 'light');
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  localStorage.setItem('theme', nextTheme);
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [auth, setAuth] = useState(() => ({
    token: getStoredToken(),
    user: getStoredUser(),
  }));
  const [brands, setBrands] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogError, setDeleteDialogError] = useState('');
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const tabs = [
    { id: 'dashboard', label: 'Posts', icon: Rows3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'generate', label: 'Generate', icon: PenLine },
    { id: 'social', label: 'Social', icon: Link2 },
    { id: 'brand', label: 'Businesses', icon: Palette },
  ];

  const selectedBrand = brands.find(brand => String(brand.id) === String(selectedBrandId)) || null;

  const loadBrands = async (preferredId) => {
    if (!auth.token) {
      setBrands([]);
      setSelectedBrandId('');
      return;
    }

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
    if (!auth.token) return undefined;

    let active = true;

    const fetchInitialBrands = async () => {
      try {
        const res = await getBrands();
        if (!active) return;

        setBrands(res.data);
        if (res.data.length === 0) {
          setSelectedBrandId('');
          return;
        }

        setSelectedBrandId(currentId => {
          const hasCurrent = res.data.some(brand => String(brand.id) === String(currentId));
          return hasCurrent ? String(currentId) : String(res.data[0].id);
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchInitialBrands();

    return () => {
      active = false;
    };
  }, [auth.token]);

  const applyTheme = (nextTheme) => {
    const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    setTheme(normalizedTheme);
  };

  useLayoutEffect(() => {
    syncDocumentTheme(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!auth.token) return undefined;

    let active = true;
    getCurrentUser()
      .then(res => {
        if (active) {
          setAuth(current => ({ ...current, user: res.data }));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [auth.token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuth({ token: null, user: null });
      setBrands([]);
      setSelectedBrandId('');
      setActiveTab('dashboard');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleAuthenticated = ({ access_token, user }) => {
    setAuth({ token: access_token, user });
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuth({ token: null, user: null });
    setBrands([]);
    setSelectedBrandId('');
    setBrandMenuOpen(false);
    setActiveTab('dashboard');
  };

  const openDeleteDialog = () => {
    setDeleteDialogError('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (isDeletingUser) return;
    setDeleteDialogOpen(false);
    setDeleteDialogError('');
  };

  const handleDeleteUser = async () => {
    setIsDeletingUser(true);
    setDeleteDialogError('');
    try {
      await deleteCurrentUser();
      setDeleteDialogOpen(false);
      handleLogout();
    } catch (err) {
      console.error(err);
      setDeleteDialogError(err.response?.data?.detail || 'Unable to delete your user profile. Please try again.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  if (!auth.token) {
    return (
      <AuthPage
        isDark={isDark}
        onAuthenticated={handleAuthenticated}
        onToggleTheme={() => applyTheme(isDark ? 'light' : 'dark')}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f7fb] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,#0f172a,#1e293b_55%,#064e3b)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.12),transparent_30%),linear-gradient(135deg,#020617,#0f172a_55%,#042f2e)] sm:h-80 lg:h-72" />
      <div className="relative">
        <header className="px-3 py-4 sm:px-5 lg:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex min-h-14 min-w-0 items-center gap-3">
              <img src="/app_logo.png" alt="" className="size-12 shrink-0 rounded-md object-contain" aria-hidden="true" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-normal text-white sm:text-xl">Social AI Automation</h1>
                <p className="truncate text-xs text-cyan-50/75 sm:text-sm">Multi-business content command center</p>
              </div>
            </div>

            <div className="grid w-full grid-cols-4 gap-1.5 sm:grid-cols-[minmax(12rem,1fr)_auto_auto_auto_auto] lg:w-[36rem] lg:grid-cols-[minmax(10rem,1.5fr)_4.75rem_minmax(5rem,0.7fr)_2.5rem_2.5rem]">
              <div className="relative col-span-4 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => setBrandMenuOpen(open => !open)}
                  className="flex min-h-8 w-full items-center justify-between gap-3 rounded-md bg-white/95 px-3 text-left text-xs font-medium text-slate-950 shadow-sm outline-none ring-1 ring-white/30 transition hover:bg-white focus:ring-4 focus:ring-teal-200/40 dark:bg-slate-900/95 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-900"
                >
                  <span className="truncate">{selectedBrand?.company_name || 'No businesses yet'}</span>
                  <ChevronDown
                    className={`shrink-0 text-slate-500 transition dark:text-slate-400 ${brandMenuOpen ? 'rotate-180' : ''}`}
                    size={16}
                    aria-hidden="true"
                  />
                </button>

                {brandMenuOpen && (
                  <div className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-lg border border-white/20 bg-white/95 p-1 shadow-2xl shadow-slate-950/25 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
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
                className={`inline-flex min-h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium ring-1 backdrop-blur transition focus:outline-none focus:ring-4 focus:ring-teal-200/30 lg:w-full ${
                  isDark
                    ? 'bg-white text-slate-950 ring-white/30 hover:bg-slate-100'
                    : 'bg-white/10 text-white ring-white/15 hover:bg-white/15'
                }`}
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDark ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
                <span className="hidden lg:inline">{isDark ? 'Dark' : 'Light'}</span>
              </button>

              <div className="inline-flex min-h-8 min-w-0 items-center justify-center gap-1.5 rounded-md bg-white/10 px-2 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur">
                <UserRound className="shrink-0" size={15} aria-hidden="true" />
                <span className="truncate">{auth.user?.full_name || auth.user?.email || 'Account'}</span>
              </div>

              <button
                type="button"
                onClick={openDeleteDialog}
                disabled={isDeletingUser}
                aria-label="Delete user profile"
                className="inline-flex min-h-8 w-full min-w-0 items-center justify-center rounded-md bg-rose-500/20 px-0 text-white ring-1 ring-rose-200/25 backdrop-blur transition hover:bg-rose-500/30 focus:outline-none focus:ring-4 focus:ring-rose-200/30 disabled:cursor-not-allowed disabled:opacity-60"
                title="Delete user profile"
              >
                <Trash2 className="shrink-0" size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="inline-flex min-h-8 w-full min-w-0 items-center justify-center rounded-md bg-white/10 px-0 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-teal-200/30"
                title="Log out"
              >
                <LogOut className="shrink-0" size={15} aria-hidden="true" />
              </button>

              <nav className="col-span-4 grid w-full grid-cols-6 gap-1 rounded-md bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur sm:col-span-5 lg:col-span-5">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex min-h-7 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 text-[0.68rem] font-medium transition sm:gap-2 sm:px-3 sm:text-[0.7rem] ${
                        activeTab === tab.id
                          ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-100 dark:text-slate-950'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="shrink-0" size={14} aria-hidden="true" />
                      <span className="hidden min-w-0 truncate sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-3 pb-8 pt-2 sm:px-5 lg:px-6">
          <div className="mb-5 max-w-2xl text-white sm:mb-6">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-teal-200 sm:text-xs">Content Studio</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-normal sm:mt-3 sm:text-3xl">
              Manage every business, page, and brand voice from one workspace.
            </h2>
          </div>

          <div className="rounded-lg border border-white/70 bg-white/90 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30 sm:p-5">
            {activeTab === 'dashboard' && <Dashboard brand={selectedBrand} />}
            {activeTab === 'calendar' && <Calendar brand={selectedBrand} />}
            {activeTab === 'performance' && <Performance brand={selectedBrand} />}
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

      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-profile-title"
        >
          <div className="w-full max-w-md rounded-lg border border-rose-200/70 bg-white p-5 shadow-2xl shadow-slate-950/30 dark:border-rose-400/20 dark:bg-slate-950">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20">
                <Trash2 size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-profile-title" className="text-base font-semibold text-slate-950 dark:text-white">
                  Delete user profile?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This will permanently delete your account, businesses, posts, and connected social accounts.
                </p>
              </div>
            </div>

            {deleteDialogError && (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                {deleteDialogError}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeletingUser}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-rose-500/30"
              >
                <Trash2 size={15} aria-hidden="true" />
                <span>{isDeletingUser ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
