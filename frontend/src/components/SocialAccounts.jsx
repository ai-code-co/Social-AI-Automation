import { useCallback, useEffect, useRef, useState } from 'react';
import { AtSign, BadgeCheck, Briefcase, ChevronDown, ExternalLink, KeyRound, Loader2, Save, Share2, ShieldCheck, Trash2 } from 'lucide-react';
import { deleteSocialAccount, getInstagramOAuthUrl, getLinkedInOAuthUrl, getMetaOAuthUrl, getSocialAccounts, getXOAuthUrl, saveSocialAccount } from '../api';

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
    scopes: 'instagram_business_basic,instagram_business_content_publish',
  },
  linkedin: {
    icon: Briefcase,
    label: 'LinkedIn Profile',
    accountLabel: 'Person URN or member ID',
    tokenLabel: 'LinkedIn OAuth access token',
    scopes: 'openid profile w_member_social',
  },
  twitter: {
    icon: AtSign,
    label: 'X Profile',
    accountLabel: 'X user ID',
    tokenLabel: 'X OAuth access token',
    scopes: 'tweet.read tweet.write users.read offline.access',
  },
};

const getAccountPlaceholder = (platform) => {
  if (platform === 'linkedin') return 'urn:li:person:abc123';
  return '1234567890';
};

const getTokenPlaceholder = (platform) => {
  if (platform === 'linkedin') return 'Paste a LinkedIn OAuth access token';
  if (platform === 'instagram') return 'Paste an Instagram Business access token';
  if (platform === 'twitter') return 'Paste an X OAuth access token';
  return 'Paste a long-lived Meta access token';
};

export default function SocialAccounts({ brand }) {
  const brandId = brand?.id;
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyAccount);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState('');
  const [connectMessage, setConnectMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const popupMonitorRef = useRef(null);

  const clearPopupMonitor = useCallback(() => {
    if (popupMonitorRef.current) {
      window.clearInterval(popupMonitorRef.current);
      popupMonitorRef.current = null;
    }
  }, []);

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
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('Facebook Page connected');
        refreshAccounts();
      }
      if (event.data?.type === 'meta-connect-error') {
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('Facebook connection was not completed');
      }
      if (event.data?.type === 'instagram-connected') {
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('Instagram account connected');
        refreshAccounts();
      }
      if (event.data?.type === 'instagram-connect-error') {
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('Instagram connection was not completed');
      }
      if (event.data?.type === 'linkedin-connected') {
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('LinkedIn account connected');
        refreshAccounts();
      }
      if (event.data?.type === 'linkedin-connect-error') {
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('LinkedIn connection was not completed');
      }
      if (event.data?.type === 'x-connected') {
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('X account connected');
        refreshAccounts();
      }
      if (event.data?.type === 'x-connect-error') {
        clearPopupMonitor();
        setConnecting('');
        setConnectMessage('X connection was not completed');
      }
    };

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, [clearPopupMonitor, refreshAccounts]);

  useEffect(() => clearPopupMonitor, [clearPopupMonitor]);

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

  const openOAuthPopup = (url, popupName, providerKey, providerLabel) => {
    clearPopupMonitor();
    const popup = window.open(url, popupName, 'width=720,height=760');
    if (!popup) {
      setConnecting('');
      alert('Popup blocked. Allow popups for this app and try again.');
      return false;
    }

    popupMonitorRef.current = window.setInterval(() => {
      if (!popup.closed) return;
      clearPopupMonitor();
      setConnecting(current => {
        if (current === providerKey) {
          setConnectMessage(`${providerLabel} connection was not completed`);
          return '';
        }
        return current;
      });
    }, 500);

    return true;
  };

  const handleOAuth = async () => {
    if (!brand) return alert('Please select a business first');
    setConnecting('meta');
    setConnectMessage('');
    try {
      const res = await getMetaOAuthUrl(brand.id);
      openOAuthPopup(res.data.url, 'meta-connect', 'meta', 'Facebook');
    } catch (err) {
      clearPopupMonitor();
      setConnecting('');
      alert(err.response?.data?.detail || 'Meta OAuth is not configured yet');
    }
  };

  const handleLinkedInOAuth = async () => {
    if (!brand) return alert('Please select a business first');
    setConnecting('linkedin');
    setConnectMessage('');
    try {
      const res = await getLinkedInOAuthUrl(brand.id);
      openOAuthPopup(res.data.url, 'linkedin-connect', 'linkedin', 'LinkedIn');
    } catch (err) {
      clearPopupMonitor();
      setConnecting('');
      alert(err.response?.data?.detail || 'LinkedIn OAuth is not configured yet');
    }
  };

  const handleInstagramOAuth = async () => {
    if (!brand) return alert('Please select a business first');
    setConnecting('instagram');
    setConnectMessage('');
    try {
      const res = await getInstagramOAuthUrl(brand.id);
      openOAuthPopup(res.data.url, 'instagram-connect', 'instagram', 'Instagram');
    } catch (err) {
      clearPopupMonitor();
      setConnecting('');
      alert(err.response?.data?.detail || 'Instagram OAuth is not configured yet');
    }
  };

  const handleXOAuth = async () => {
    if (!brand) return alert('Please select a business first');
    setConnecting('x');
    setConnectMessage('');
    try {
      const res = await getXOAuthUrl(brand.id);
      openOAuthPopup(res.data.url, 'x-connect', 'x', 'X');
    } catch (err) {
      clearPopupMonitor();
      setConnecting('');
      alert(err.response?.data?.detail || 'X OAuth is not configured yet');
    }
  };

  const platform = PLATFORM_COPY[form.platform];
  const PlatformIcon = platform.icon;

  if (!brand) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
          Select or create a business before connecting social accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Social Publishing</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-2xl">Connected accounts</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Connect the accounts that scheduled posts should publish to for {brand.company_name}.
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
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Connect accounts</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Use OAuth for friendly setup, or manual tokens for fallback testing.</p>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
                <Share2 size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Facebook Page</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Choose the Facebook Page this business should publish scheduled Facebook posts to.
                </p>
              </div>
            </div>
            <button
              onClick={handleOAuth}
              disabled={Boolean(connecting)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            >
              {connecting === 'meta' ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ExternalLink size={17} aria-hidden="true" />}
              {connecting === 'meta' ? 'Waiting for Facebook' : 'Connect Facebook'}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
                <AtSign size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Instagram Business</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Sign in with Instagram Business Login to connect publishing access for Instagram posts.
                </p>
              </div>
            </div>
            <button
              onClick={handleInstagramOAuth}
              disabled={Boolean(connecting)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            >
              {connecting === 'instagram' ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ExternalLink size={17} aria-hidden="true" />}
              {connecting === 'instagram' ? 'Waiting for Instagram' : 'Connect Instagram'}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
                <Briefcase size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-950 dark:text-white">LinkedIn Profile</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Sign in with LinkedIn to connect profile publishing access for scheduled posts.
                </p>
              </div>
            </div>
            <button
              onClick={handleLinkedInOAuth}
              disabled={Boolean(connecting)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            >
              {connecting === 'linkedin' ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ExternalLink size={17} aria-hidden="true" />}
              {connecting === 'linkedin' ? 'Waiting for LinkedIn' : 'Connect LinkedIn'}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
                <AtSign size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-950 dark:text-white">X Profile</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Sign in with X to connect posting access for scheduled short-form updates.
                </p>
              </div>
            </div>
            <button
              onClick={handleXOAuth}
              disabled={Boolean(connecting)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            >
              {connecting === 'x' ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <ExternalLink size={17} aria-hidden="true" />}
              {connecting === 'x' ? 'Waiting for X' : 'Connect X'}
            </button>
          </div>

          {connectMessage && (
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{connectMessage}</p>
          )}

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
                  <option value="linkedin">LinkedIn Profile</option>
                  <option value="twitter">X Profile</option>
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
                    placeholder={getAccountPlaceholder(form.platform)}
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
                  placeholder={getTokenPlaceholder(form.platform)}
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
