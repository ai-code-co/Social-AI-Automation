import { useCallback, useEffect, useState } from 'react';
import { AtSign, BadgeCheck, ChevronDown, ExternalLink, KeyRound, Loader2, Save, Share2, ShieldCheck, Trash2 } from 'lucide-react';
import { deleteSocialAccount, getMetaOAuthUrl, getSocialAccounts, saveSocialAccount } from '../api';

const emptyAccount = {
  platform: 'facebook',
  handle: '',
  account_id: '',
  access_token: '',
  scopes: 'pages_manage_posts,pages_read_engagement,pages_show_list',
  is_active: true,
};

const PLATFORM_COPY = {
  facebook: {
    icon: Share2,
    label: 'Facebook Page',
    accountLabel: 'Page ID',
    tokenLabel: 'Page access token',
    scopes: 'pages_manage_posts,pages_read_engagement,pages_show_list',
  },
  instagram: {
    icon: AtSign,
    label: 'Instagram Business',
    accountLabel: 'Instagram user ID',
    tokenLabel: 'Instagram content publishing token',
    scopes: 'instagram_basic,instagram_content_publish,pages_show_list',
  },
};

export default function SocialAccounts({ brand }) {
  const brandId = brand?.id;
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyAccount);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const refreshAccounts = useCallback(async () => {
    if (!brand) {
      setAccounts([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getSocialAccounts(brand.id);
      setAccounts(res.data);
    } catch {
      alert('Unable to load social accounts');
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    let active = true;

    const loadAccounts = async () => {
      if (!brandId) {
        if (active) setAccounts([]);
        return;
      }

      setLoading(true);
      try {
        const res = await getSocialAccounts(brandId);
        if (active) setAccounts(res.data);
      } catch {
        if (active) alert('Unable to load social accounts');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAccounts();
    return () => {
      active = false;
    };
  }, [brandId]);

  useEffect(() => {
    const handleMetaMessage = (event) => {
      if (event.data?.type === 'meta-connected') {
        setConnecting(false);
        setConnectMessage('Meta account connected');
        refreshAccounts();
      }
      if (event.data?.type === 'meta-connect-error') {
        setConnecting(false);
        setConnectMessage('Meta connection was not completed');
      }
    };

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, [refreshAccounts]);

  const changePlatform = (platform) => {
    setForm({
      ...emptyAccount,
      platform,
      scopes: PLATFORM_COPY[platform].scopes,
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!brand) return alert('Please select a business first');
    if (!form.handle.trim() || !form.account_id.trim() || !form.access_token.trim()) {
      alert('Handle, account ID, and access token are required');
      return;
    }

    setSaving(true);
    try {
      await saveSocialAccount({
        ...form,
        brand_id: brand.id,
        handle: form.handle.trim(),
        account_id: form.account_id.trim(),
        access_token: form.access_token.trim(),
      });
      setSaved(true);
      setForm({ ...emptyAccount, platform: form.platform, scopes: PLATFORM_COPY[form.platform].scopes });
      await refreshAccounts();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to save social account');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (account) => {
    if (!window.confirm(`Disconnect ${account.handle}?`)) return;
    await deleteSocialAccount(account.id);
    await refreshAccounts();
  };

  const handleOAuth = async () => {
    if (!brand) return alert('Please select a business first');
    setConnecting(true);
    setConnectMessage('');
    try {
      const res = await getMetaOAuthUrl(brand.id);
      const popup = window.open(res.data.url, 'meta-connect', 'width=720,height=760');
      if (!popup) {
        setConnecting(false);
        alert('Popup blocked. Allow popups for this app and try again.');
      }
    } catch (err) {
      setConnecting(false);
      alert(err.response?.data?.detail || 'Meta OAuth is not configured yet');
    }
  };

  const platform = PLATFORM_COPY[form.platform];
  const PlatformIcon = platform.icon;

  if (!brand) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
          Select or create a business before connecting Facebook and Instagram accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Meta Publishing</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-2xl">Connected accounts</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Connect the Facebook Page that scheduled posts should publish to for {brand.company_name}. Linked Instagram accounts are detected automatically.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Saved accounts</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">One active account per platform is used when publishing.</p>
            </div>
            {loading && <Loader2 className="animate-spin text-slate-400" size={18} aria-hidden="true" />}
          </div>

          <div className="mt-4 space-y-3">
            {accounts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No connected accounts yet.
              </div>
            ) : (
              accounts.map(account => {
                const Icon = PLATFORM_COPY[account.platform]?.icon || KeyRound;
                return (
                  <div key={account.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300">
                          <Icon size={18} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{account.handle}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{account.platform}</p>
                          {account.last_error && <p className="mt-2 text-xs leading-5 text-rose-600">{account.last_error}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(account)}
                        className="grid size-9 shrink-0 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                        title="Disconnect account"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-950 text-white dark:bg-slate-800">
              <ShieldCheck size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Connect Meta</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sign in with Facebook, choose a Page, and connect publishing access.</p>
            </div>
          </div>
          {saved && showAdvanced && (
            <div className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700">
              <BadgeCheck size={16} aria-hidden="true" />
              Saved
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-teal-100 bg-teal-50 p-4 dark:border-teal-500/20 dark:bg-teal-500/10">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
                <Share2 size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Facebook and Instagram</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Choose the Facebook Page for this business. If that Page has an Instagram Business account linked, it will be connected at the same time.
                </p>
              </div>
            </div>
            <button
              onClick={handleOAuth}
              disabled={connecting}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            >
              {connecting ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ExternalLink size={17} aria-hidden="true" />}
              {connecting ? 'Waiting for Meta' : accounts.length ? 'Reconnect Meta' : 'Connect Meta'}
            </button>
            {connectMessage && (
              <p className="mt-3 text-sm font-medium text-teal-700 dark:text-teal-300">{connectMessage}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(open => !open)}
            className="inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className="inline-flex items-center gap-2">
              <KeyRound size={16} aria-hidden="true" />
              Advanced manual setup
            </span>
            <ChevronDown
              size={16}
              className={`transition ${showAdvanced ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                <PlatformIcon size={16} aria-hidden="true" />
                Manual token connection
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Platform</label>
                <select
                  value={form.platform}
                  onChange={e => changePlatform(e.target.value)}
                  className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-teal-500/20"
                >
                  <option value="facebook">Facebook Page</option>
                  <option value="instagram">Instagram Business</option>
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Handle</label>
                  <input
                    value={form.handle}
                    onChange={e => setForm({ ...form, handle: e.target.value })}
                    placeholder="@yourpage"
                    className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{platform.accountLabel}</label>
                  <input
                    value={form.account_id}
                    onChange={e => setForm({ ...form, account_id: e.target.value })}
                    placeholder="1234567890"
                    className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{platform.tokenLabel}</label>
                <textarea
                  value={form.access_token}
                  onChange={e => setForm({ ...form, access_token: e.target.value })}
                  rows={4}
                  placeholder="Paste a long-lived Meta access token"
                  className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-teal-500/20"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
              >
                {saving ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                {saving ? 'Saving' : `Save ${platform.label}`}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
