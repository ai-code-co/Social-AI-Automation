import { AtSign, Briefcase, Check, Clock, FileText, Globe2, Pause, Share2, Trash2, Video } from 'lucide-react';
import { approvePost, pausePost, deletePost } from '../api';

export default function PostCard({ post, onRefresh }) {
  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    pending_approval: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    scheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
    published: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    failed: 'bg-rose-50 text-rose-700 ring-rose-200',
    paused: 'bg-orange-50 text-orange-700 ring-orange-200',
  };

  const platformIcons = {
    instagram: AtSign,
    facebook: Share2,
    linkedin: Briefcase,
    twitter: AtSign,
    tiktok: FileText,
    youtube: Video,
  };

  const handleApprove = async () => {
    await approvePost(post.id);
    onRefresh();
  };

  const handlePause = async () => {
    await pausePost(post.id);
    onRefresh();
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this post?')) {
      await deletePost(post.id);
      onRefresh();
    }
  };

  const PlatformIcon = platformIcons[post.platform] || Globe2;

  return (
    <article className="flex min-h-72 flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/40 dark:hover:shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <PlatformIcon size={17} aria-hidden="true" />
          </div>
          <span className="truncate text-sm font-semibold capitalize text-slate-950 dark:text-white">{post.platform}</span>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ${statusColors[post.status] || statusColors.draft}`}>
          {post.status.replace('_', ' ')}
        </span>
      </div>

      <p className="line-clamp-5 text-sm leading-6 text-slate-700 dark:text-slate-300">{post.caption}</p>

      {post.hashtags && (
        <p className="text-sm font-medium leading-6 text-teal-700">{post.hashtags}</p>
      )}

      {post.image_prompt && (
        <p className="rounded-md bg-slate-50 p-3 text-xs italic leading-5 text-slate-500 dark:bg-slate-950 dark:text-slate-400">{post.image_prompt}</p>
      )}

      {post.scheduled_at && (
        <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock size={13} aria-hidden="true" />
          Scheduled: {new Date(post.scheduled_at).toLocaleString()}
        </p>
      )}

      <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {['draft', 'pending_approval'].includes(post.status) && (
          <button
            onClick={handleApprove}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            <Check size={14} aria-hidden="true" />
            Approve
          </button>
        )}
        {post.status !== 'paused' && (
          <button
            onClick={handlePause}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
          >
            <Pause size={14} aria-hidden="true" />
            Pause
          </button>
        )}
        <button
          onClick={handleDelete}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}
