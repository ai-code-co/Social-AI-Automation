import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, Rocket, Sparkles, Wand2 } from 'lucide-react';
import { getPosts, generateBatch, approveAll } from '../api';
import PostCard from './PostCard';

export default function Dashboard({ brand }) {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchPosts = useCallback(async (showLoader = true) => {
    if (!brand) {
      setPosts([]);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }
    try {
      const res = await getPosts(filter || undefined, undefined, brand?.id);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [brand, filter]);

  useEffect(() => {
    queueMicrotask(fetchPosts);
  }, [fetchPosts]);

  useEffect(() => {
    if (!brand) return undefined;

    const intervalId = window.setInterval(() => {
      fetchPosts(false);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [brand, fetchPosts]);

  const handleGenerateBatch = async () => {
    setGenerating(true);
    try {
      const res = await generateBatch(brand.id);
      alert(res.data.message);
      fetchPosts();
    } catch {
      alert('Error generating posts');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAll = async () => {
    await approveAll(brand.id);
    fetchPosts();
  };

  const statuses = ['', 'pending_approval', 'approved', 'scheduled', 'published', 'paused', 'failed'];

  const counts = {
    pending: posts.filter(p => p.status === 'pending_approval').length,
    approved: posts.filter(p => p.status === 'approved').length,
    published: posts.filter(p => p.status === 'published').length,
  };

  const stats = [
    { label: 'Pending Approval', value: counts.pending, icon: Clock3, accent: 'text-amber-600', tint: 'bg-amber-50' },
    { label: 'Approved', value: counts.approved, icon: CheckCircle2, accent: 'text-emerald-600', tint: 'bg-emerald-50' },
    { label: 'Published', value: counts.published, icon: Rocket, accent: 'text-sky-600', tint: 'bg-sky-50' },
  ];

  if (!brand) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-teal-50/70 p-8 text-center dark:border-slate-700 dark:from-slate-900 dark:to-teal-950/40">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
            <Sparkles size={22} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Add your first business</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
            Create a business profile first so posts, brand memory, and automation stay organized.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Publishing Pipeline</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950 dark:text-white">Posts dashboard</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-400">
            Review generated copy for {brand.company_name}, approve ready posts, and keep every platform moving.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
          <button
            onClick={handleApproveAll}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Approve All
          </button>
          <button
            onClick={handleGenerateBatch}
            disabled={generating}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-medium text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
          >
            {generating ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Wand2 size={16} aria-hidden="true" />}
            {generating ? 'Generating' : 'Generate Batch'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-semibold tracking-normal ${stat.accent}`}>{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
                <div className={`grid size-9 place-items-center rounded-md ${stat.tint} ${stat.accent}`}>
                  <Icon size={17} aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-wrap sm:overflow-visible">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`min-h-8 shrink-0 rounded-md px-3 text-xs font-medium capitalize transition ${
              filter === s
                ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            Loading posts
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-teal-50/70 p-8 text-center dark:border-slate-700 dark:from-slate-900 dark:to-teal-950/40">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">No posts yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              Generate a batch or create a single post to fill your content queue.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onRefresh={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
