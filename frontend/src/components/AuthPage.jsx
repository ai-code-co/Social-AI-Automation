import { useState } from 'react';
import { Building2, Loader2, LockKeyhole, LogIn, Mail, Moon, Sun, User, UserPlus } from 'lucide-react';
import { loginUser, registerUser, saveAuthSession } from '../api';

export default function AuthPage({ isDark, onAuthenticated, onToggleTheme }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegistering = mode === 'register';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required');
      return;
    }

    if (isRegistering && form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      };
      if (isRegistering) {
        payload.full_name = form.full_name.trim();
      }

      const res = isRegistering ? await registerUser(payload) : await loginUser(payload);
      saveAuthSession(res.data);
      onAuthenticated(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,#0f172a,#1e293b_55%,#064e3b)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.12),transparent_30%),linear-gradient(135deg,#020617,#0f172a_55%,#042f2e)]" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <section>
            <div className="flex items-center gap-3 text-white">
              <div className="grid size-12 place-items-center rounded-lg bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
                <Building2 size={23} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">Social AI Automation</h1>
                <p className="text-sm text-cyan-50/75">Private workspaces for every creator and business</p>
              </div>
            </div>
            <div className="mt-8 max-w-xl">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-600 dark:text-teal-200">Workspace Access</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-5xl">
                Sign in to manage your brands, posts, and publishing queue.
              </h2>
            </div>
          </section>

          <section className="rounded-lg border border-white/70 bg-white/95 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                  {isRegistering ? 'Create Account' : 'Welcome Back'}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
                  {isRegistering ? 'Register' : 'Log in'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
                <span>{isDark ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                  !isRegistering
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <LogIn size={16} aria-hidden="true" />
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                  isRegistering
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus size={16} aria-hidden="true" />
                Register
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {isRegistering && (
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <User size={15} aria-hidden="true" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={event => setForm({ ...form, full_name: event.target.value })}
                    placeholder="Your name"
                    className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-teal-500/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Mail size={15} aria-hidden="true" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                  placeholder="you@example.com"
                  className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <LockKeyhole size={15} aria-hidden="true" />
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={event => setForm({ ...form, password: event.target.value })}
                  placeholder={isRegistering ? 'At least 8 characters' : 'Your password'}
                  className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-teal-500/20"
                />
              </div>

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
              >
                {loading ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : isRegistering ? <UserPlus size={17} aria-hidden="true" /> : <LogIn size={17} aria-hidden="true" />}
                {loading ? 'Please wait' : isRegistering ? 'Create Account' : 'Log in'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
