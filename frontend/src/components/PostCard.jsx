import { useState } from 'react';
import { AtSign, Briefcase, CalendarClock, Check, Clock, Copy, Edit3, ExternalLink, Globe2, Pause, Play, Save, Share2, Trash2, X } from 'lucide-react';
import { approvePost, pausePost, resumePost, deletePost, duplicatePost, getMediaUrl, updatePost } from '../api';
import ConfirmDialog from './ConfirmDialog';

const parseScheduledAt = (value) => {
  if (!value) return null;
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`);
};

const toDateTimeLocalValue = (date) => {
  if (!date || Number.isNaN(date.getTime())) return '';

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const PLATFORM_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
};

const getEnabledPlatforms = (brand) => (
  (brand?.enabled_platforms || 'instagram,facebook,linkedin,twitter')
    .split(',')
    .map(platform => platform.trim().toLowerCase())
    .filter(Boolean)
);

export default function PostCard({ post, brand, onRefresh }) {
  const initialScheduledAt = toDateTimeLocalValue(parseScheduledAt(post.scheduled_at));
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [rescheduling, setRescheduling] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [editing, setEditing] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicatePlatforms, setDuplicatePlatforms] = useState([]);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [imagePromptVisible, setImagePromptVisible] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const [editHashtags, setEditHashtags] = useState(post.hashtags || '');
  const [savingEdit, setSavingEdit] = useState(false);

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
  };

  const handleApprove = async () => {
    await approvePost(post.id);
    onRefresh();
  };

  const handlePause = async () => {
    await pausePost(post.id);
    onRefresh();
  };

  const handleResume = async () => {
    await resumePost(post.id);
    onRefresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deletePost(post.id);
      setDeleteDialogOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setDeleteError(err.response?.data?.detail || 'Unable to delete this post. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const availableDuplicatePlatforms = getEnabledPlatforms(brand)
    .filter(platform => platform !== post.platform && PLATFORM_LABELS[platform]);

  const openDuplicateDialog = () => {
    setDuplicatePlatforms([]);
    setDuplicateError('');
    setDuplicateDialogOpen(true);
  };

  const closeDuplicateDialog = () => {
    if (duplicating) return;
    setDuplicateDialogOpen(false);
    setDuplicateError('');
  };

  const toggleDuplicatePlatform = (platform) => {
    setDuplicatePlatforms(current => (
      current.includes(platform)
        ? current.filter(item => item !== platform)
        : [...current, platform]
    ));
  };

  const handleDuplicatePost = async () => {
    if (duplicatePlatforms.length === 0) {
      setDuplicateError('Choose at least one platform.');
      return;
    }

    setDuplicating(true);
    setDuplicateError('');
    try {
      await duplicatePost(post.id, { platforms: duplicatePlatforms });
      setDuplicateDialogOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setDuplicateError(err.response?.data?.detail || 'Unable to copy this post. Please try again.');
    } finally {
      setDuplicating(false);
    }
  };

  const startRescheduling = () => {
    setScheduledAt(initialScheduledAt);
    setRescheduling(true);
  };

  const cancelRescheduling = () => {
    setScheduledAt(initialScheduledAt);
    setRescheduling(false);
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      alert('Choose a publish date and time');
      return;
    }

    setSavingSchedule(true);
    try {
      await updatePost(post.id, {
        status: 'scheduled',
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      setRescheduling(false);
      onRefresh();
    } finally {
      setSavingSchedule(false);
    }
  };

  const startEditing = () => {
    setEditCaption(post.caption || '');
    setEditHashtags(post.hashtags || '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditCaption(post.caption || '');
    setEditHashtags(post.hashtags || '');
  };

  const handleSaveEdit = async () => {
    if (!editCaption.trim()) {
      alert('Caption is required');
      return;
    }

    setSavingEdit(true);
    try {
      await updatePost(post.id, {
        caption: editCaption.trim(),
        hashtags: editHashtags.trim(),
      });
      setEditing(false);
      onRefresh();
    } finally {
      setSavingEdit(false);
    }
  };

  const PlatformIcon = platformIcons[post.platform] || Globe2;
  const showPostActions = post.status !== 'published';
  const canEditPost = post.status !== 'published';
  const isLongCaption = (post.caption || '').length > 220;
  const scheduledAtDate = parseScheduledAt(post.scheduled_at);
  const canSchedulePost = ['draft', 'pending_approval', 'approved', 'failed'].includes(post.status);
  const canReschedulePost = post.status === 'scheduled';
  const showScheduleForm = canSchedulePost || (canReschedulePost && rescheduling);
  const hasApproveAction = ['draft', 'pending_approval'].includes(post.status);

  return (
    <article className="flex min-h-64 flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/40 dark:hover:shadow-black/20 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <PlatformIcon size={15} aria-hidden="true" />
          </div>
          <span className="truncate text-xs font-semibold capitalize text-slate-950 dark:text-white">{post.platform}</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            onClick={openDuplicateDialog}
            className="grid size-8 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Copy to another platform"
          >
            <Copy size={14} aria-hidden="true" />
          </button>
          {canEditPost && !editing && (
            <button
              onClick={startEditing}
              className="grid size-8 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Edit caption and hashtags"
            >
              <Edit3 size={14} aria-hidden="true" />
            </button>
          )}
          <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ${statusColors[post.status] || statusColors.draft}`}>
            {post.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {post.image_url && (
        <img
          src={getMediaUrl(post.image_url)}
          alt={post.image_prompt || 'Generated post visual'}
          className="aspect-square w-full rounded-md border border-slate-100 object-cover dark:border-slate-800"
          loading="lazy"
        />
      )}

      {editing ? (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Caption</label>
            <textarea
              value={editCaption}
              onChange={e => setEditCaption(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Hashtags</label>
            <textarea
              value={editHashtags}
              onChange={e => setEditHashtags(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            >
              <Save size={14} aria-hidden="true" />
              {savingEdit ? 'Saving' : 'Save'}
            </button>
            <button
              onClick={cancelEditing}
              disabled={savingEdit}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={14} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className={`${captionExpanded ? '' : 'line-clamp-5'} whitespace-pre-line text-xs leading-5 text-slate-700 dark:text-slate-300`}>
            {post.caption}
          </p>
          {isLongCaption && (
            <button
              type="button"
              onClick={() => setCaptionExpanded(expanded => !expanded)}
              className="mt-2 text-xs font-semibold text-teal-700 transition hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              {captionExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {!editing && post.hashtags && (
        <p className="text-xs font-medium leading-5 text-teal-700">{post.hashtags}</p>
      )}

      {post.image_prompt && (
        <div>
          <button
            type="button"
            onClick={() => setImagePromptVisible(visible => !visible)}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {imagePromptVisible ? 'Hide image prompt' : 'Show image prompt'}
          </button>
          {imagePromptVisible && (
            <p className="mt-2 rounded-md bg-slate-50 p-3 text-xs italic leading-5 text-slate-500 dark:bg-slate-950 dark:text-slate-400">{post.image_prompt}</p>
          )}
        </div>
      )}

      {post.scheduled_at && scheduledAtDate && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p className="flex min-w-0 items-center gap-2">
            <Clock size={13} aria-hidden="true" />
            <span>Scheduled: {scheduledAtDate.toLocaleString()}</span>
          </p>
          {canReschedulePost && !rescheduling && (
            <button
              type="button"
              onClick={startRescheduling}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <CalendarClock size={13} aria-hidden="true" />
              Edit schedule
            </button>
          )}
        </div>
      )}

      {post.error_log && (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
          {post.error_log}
        </p>
      )}

      {post.platform_post_url && (
        <a
          href={post.platform_post_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
        >
          <ExternalLink size={14} aria-hidden="true" />
          View published post
        </a>
      )}

      {showScheduleForm && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <CalendarClock size={13} aria-hidden="true" />
            {canReschedulePost ? 'Schedule time' : 'Publish date'}
          </label>
          <div className={`grid gap-2 ${canReschedulePost ? 'grid-cols-[minmax(0,1fr)_auto_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              disabled={savingSchedule}
              className="min-h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              onClick={handleSchedule}
              disabled={savingSchedule}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-medium text-white transition hover:bg-slate-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            >
              {savingSchedule ? 'Saving' : canReschedulePost ? 'Save' : 'Schedule'}
            </button>
            {canReschedulePost && (
              <button
                type="button"
                onClick={cancelRescheduling}
                disabled={savingSchedule}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {showPostActions && (
      <div className={`mt-auto grid gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 ${hasApproveAction ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {hasApproveAction && (
          <button
            onClick={handleApprove}
            className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-medium text-white transition hover:bg-emerald-500 sm:px-3"
          >
            <Check size={14} aria-hidden="true" />
            Approve
          </button>
        )}
        {post.status === 'paused' ? (
          <button
            onClick={handleResume}
            className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 sm:px-3"
          >
            <Play size={14} aria-hidden="true" />
            Resume
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2 text-xs font-medium text-orange-700 transition hover:bg-orange-100 sm:px-3"
          >
            <Pause size={14} aria-hidden="true" />
            Pause
          </button>
        )}
        <button
          onClick={() => {
            setDeleteError('');
            setDeleteDialogOpen(true);
          }}
          className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100 sm:px-3"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>
      )}

      {duplicateDialogOpen && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`copy-post-title-${post.id}`}
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/30 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/20">
                <Copy size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 id={`copy-post-title-${post.id}`} className="text-base font-semibold text-slate-950 dark:text-white">
                  Copy post to platform
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Choose where to create the same post as a new draft.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {availableDuplicatePlatforms.length === 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                  No other enabled platforms are available for this business.
                </p>
              ) : (
                availableDuplicatePlatforms.map(platform => {
                  const selected = duplicatePlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => toggleDuplicatePlatform(platform)}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 text-left text-sm font-medium transition ${
                        selected
                          ? 'border-teal-400 bg-teal-50 text-teal-800 dark:border-teal-400/40 dark:bg-teal-500/10 dark:text-teal-200'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{PLATFORM_LABELS[platform]}</span>
                      <span className={`grid size-5 place-items-center rounded border ${
                        selected
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950'
                      }`}>
                        {selected && <Check size={13} aria-hidden="true" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {duplicateError && (
              <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                {duplicateError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeDuplicateDialog}
                disabled={duplicating}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDuplicatePost}
                disabled={duplicating || availableDuplicatePlatforms.length === 0}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
              >
                <Copy size={15} aria-hidden="true" />
                {duplicating ? 'Copying...' : 'Create drafts'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete post?"
        message={`This will permanently delete this ${post.platform} post from your workspace.`}
        confirmLabel="Delete"
        error={deleteError}
        loading={deleting}
        onCancel={() => {
          if (deleting) return;
          setDeleteDialogOpen(false);
          setDeleteError('');
        }}
        onConfirm={handleDelete}
      />
    </article>
  );
}
