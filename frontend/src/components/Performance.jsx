import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, Heart, Loader2, MessageCircle, MousePointerClick, Share2, Sparkles, Trophy } from 'lucide-react';
import { getPerformanceSummary } from '../api';

const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);

const formatRate = (value) => `${Number(value || 0).toFixed(2)}%`;

const platformLabel = (platform) => {
  if (platform === 'twitter') return 'Twitter/X';
  return platform.charAt(0).toUpperCase() + platform.slice(1);
};

const shortCaption = (caption) => {
  if (!caption) return 'Untitled post';
  return caption.length > 96 ? `${caption.slice(0, 96).trim()}...` : caption;
};

export default function Performance({ brand }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postPage, setPostPage] = useState(1);

  const fetchPerformance = useCallback(async () => {
    if (!brand) {
      setSummary(null);
      return;
    }

    setLoading(true);
    try {
      const res = await getPerformanceSummary(brand.id);
      setPostPage(1);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    queueMicrotask(fetchPerformance);
  }, [fetchPerformance]);

  const maxPlatformEngagement = useMemo(() => (
    Math.max(...(summary?.platforms || []).map(platform => platform.engagement_count), 1)
  ), [summary]);

  if (!brand) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-teal-50/70 p-8 text-center dark:border-slate-700 dark:from-slate-900 dark:to-teal-950/40">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
            <BarChart3 size={22} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Add your first business</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
            Create a business profile first so performance can be tracked by brand.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          Loading performance
        </div>
      </div>
    );
  }

  const totals = summary?.totals || {};
  const platforms = summary?.platforms || [];
  const posts = summary?.posts || [];
  const topPosts = summary?.top_posts || [];
  const postsPerPage = 10;
  const totalPostPages = Math.max(Math.ceil(posts.length / postsPerPage), 1);
  const safePostPage = Math.min(postPage, totalPostPages);
  const pagedPosts = posts.slice((safePostPage - 1) * postsPerPage, safePostPage * postsPerPage);
  const hasMetrics = (totals.views_count || totals.engagement_count || 0) > 0;

  const statCards = [
    { label: 'Views', value: formatNumber(totals.views_count), icon: Eye, accent: 'text-sky-600', tint: 'bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300' },
    { label: 'Likes', value: formatNumber(totals.likes_count), icon: Heart, accent: 'text-rose-600', tint: 'bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300' },
    { label: 'Engagement', value: formatNumber(totals.engagement_count), icon: Trophy, accent: 'text-amber-600', tint: 'bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300' },
    { label: 'Engagement Rate', value: formatRate(totals.engagement_rate), icon: BarChart3, accent: 'text-teal-600', tint: 'bg-teal-50 dark:bg-teal-500/10 dark:text-teal-300' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Performance</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950 dark:text-white">Performance dashboard</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-400">
            Track post metrics for {brand.company_name}, compare platforms, and spot what performs best.
          </p>
        </div>
        <div className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {formatNumber(totals.published_count)} published posts
        </div>
      </div>

      {!hasMetrics && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          Metrics are ready, but no likes/views have been synced or entered yet. Platform sync can be added next.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-xl font-semibold tracking-normal ${stat.accent}`}>{stat.value}</p>
                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
                <div className={`grid size-8 shrink-0 place-items-center rounded-md ${stat.tint}`}>
                  <Icon size={15} aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Platform comparison</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Engagement totals by platform.</p>
            </div>
            <BarChart3 className="text-teal-600 dark:text-teal-300" size={18} aria-hidden="true" />
          </div>

          <div className="mt-4 space-y-3">
            {platforms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No posts to compare yet.
              </div>
            ) : (
              platforms.map(platform => {
                const percent = Math.max((platform.engagement_count / maxPlatformEngagement) * 100, 4);
                return (
                  <div key={platform.platform} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{platformLabel(platform.platform)}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatNumber(platform.engagement_count)} engagement • {formatRate(platform.engagement_rate)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[0.68rem] text-slate-500 dark:text-slate-400">
                      <span>{formatNumber(platform.views_count)} views</span>
                      <span>{formatNumber(platform.likes_count)} likes</span>
                      <span>{formatNumber(platform.posts_count)} posts</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Top posts</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Ranked by total engagement.</p>
            </div>
            <Sparkles className="text-teal-600 dark:text-teal-300" size={18} aria-hidden="true" />
          </div>

          <div className="mt-4 space-y-2">
            {topPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No post metrics yet.
              </div>
            ) : (
              topPosts.map((post, index) => (
                <div key={post.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">#{index + 1} • {platformLabel(post.platform)}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700 dark:text-slate-300">{shortCaption(post.caption)}</p>
                    </div>
                    <div className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {formatNumber(post.engagement_count)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Post performance</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Metrics for each post in this business.</p>
          </div>
          {posts.length > postsPerPage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPostPage(page => Math.max(page - 1, 1))}
                disabled={safePostPage === 1}
                className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {safePostPage} / {totalPostPages}
              </span>
              <button
                type="button"
                onClick={() => setPostPage(page => Math.min(page + 1, totalPostPages))}
                disabled={safePostPage === totalPostPages}
                className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No posts yet.
            </div>
          ) : (
            <div className="min-w-[42rem]">
              <div className="grid grid-cols-[1.5fr_0.75fr_repeat(5,0.5fr)_0.6fr] gap-2 border-b border-slate-200 pb-2 text-[0.68rem] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Post</span>
                <span>Platform</span>
                <span>Views</span>
                <span>Likes</span>
                <span>Comments</span>
                <span>Shares</span>
                <span>Clicks</span>
                <span>Rate</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagedPosts.map(post => (
                  <div key={post.id} className="grid grid-cols-[1.5fr_0.75fr_repeat(5,0.5fr)_0.6fr] gap-2 py-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="line-clamp-2 pr-2 text-slate-800 dark:text-slate-100">{shortCaption(post.caption)}</span>
                    <span className="capitalize">{platformLabel(post.platform)}</span>
                    <span className="inline-flex items-center gap-1"><Eye size={12} aria-hidden="true" />{formatNumber(post.views_count)}</span>
                    <span className="inline-flex items-center gap-1"><Heart size={12} aria-hidden="true" />{formatNumber(post.likes_count)}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle size={12} aria-hidden="true" />{formatNumber(post.comments_count)}</span>
                    <span className="inline-flex items-center gap-1"><Share2 size={12} aria-hidden="true" />{formatNumber(post.shares_count)}</span>
                    <span className="inline-flex items-center gap-1"><MousePointerClick size={12} aria-hidden="true" />{formatNumber(post.clicks_count)}</span>
                    <span>{formatRate(post.engagement_rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
