import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, Sparkles } from 'lucide-react';
import { getPosts } from '../api';
import PostCard from './PostCard';
import SelectMenu from './SelectMenu';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_OPTIONS = ['', 'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'paused', 'failed'];

const statusStyles = {
  draft: 'bg-slate-500',
  pending_approval: 'bg-amber-500',
  approved: 'bg-emerald-500',
  scheduled: 'bg-sky-500',
  published: 'bg-indigo-500',
  failed: 'bg-rose-500',
  paused: 'bg-orange-500',
};

const getPostDate = (post) => post.scheduled_at || post.published_at || post.created_at;

const toDateKey = (value) => {
  if (!value) return '';
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getMonthDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const days = [];

  for (let index = 0; index < leadingDays; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

const getDateKeyFromDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Calendar({ brand }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKeyFromDate(new Date()));

  const fetchPosts = useCallback(async (showLoader = true) => {
    if (!brand) {
      setPosts([]);
      return;
    }

    if (showLoader) setLoading(true);
    try {
      const res = await getPosts(statusFilter || undefined, platformFilter || undefined, brand.id);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [brand, platformFilter, statusFilter]);

  useEffect(() => {
    queueMicrotask(fetchPosts);
  }, [fetchPosts]);

  const postsByDay = useMemo(() => posts.reduce((grouped, post) => {
    const key = toDateKey(getPostDate(post));
    if (!key) return grouped;
    return {
      ...grouped,
      [key]: [...(grouped[key] || []), post],
    };
  }, {}), [posts]);

  const monthDays = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const selectedPosts = postsByDay[selectedDateKey] || [];
  const enabledPlatforms = (brand?.enabled_platforms || 'instagram,facebook')
    .split(',')
    .map(platform => platform.trim().toLowerCase())
    .filter(Boolean);
  const platformOptions = [
    { value: '', label: 'All platforms' },
    ...enabledPlatforms.map(platform => ({
      value: platform,
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
    })),
  ];
  const statusOptions = STATUS_OPTIONS.map(status => ({
    value: status,
    label: status ? status.replace('_', ' ') : 'All statuses',
  }));

  const monthLabel = monthDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.min(currentYear - 5, pickerYear - 5);
    const endYear = Math.max(currentYear + 5, pickerYear + 5);

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => {
        const year = startYear + index;
        return { value: year, label: String(year) };
      },
    );
  }, [pickerYear]);

  const moveMonth = (direction) => {
    setMonthDate(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setMonthPickerOpen(false);
  };

  const selectToday = () => {
    const today = new Date();
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(getDateKeyFromDate(today));
    setMonthPickerOpen(false);
  };

  const openMonthPicker = () => {
    setPickerYear(monthDate.getFullYear());
    setMonthPickerOpen(open => !open);
  };

  const selectMonth = (monthIndex) => {
    const nextMonth = new Date(pickerYear, monthIndex, 1);
    setMonthDate(nextMonth);
    setSelectedDateKey(getDateKeyFromDate(nextMonth));
    setMonthPickerOpen(false);
  };

  if (!brand) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-teal-50/70 p-8 text-center dark:border-slate-700 dark:from-slate-900 dark:to-teal-950/40">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
            <CalendarDays size={22} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Add your first business</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
            Create a business profile first so the publishing calendar can show planned posts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Planning Calendar</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950 dark:text-white">Publishing calendar</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-400">
            Plan scheduled, approved, and published posts for {brand.company_name} by date.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <div className="min-w-0 sm:w-40">
            <SelectMenu
            value={platformFilter}
            options={platformOptions}
            onChange={setPlatformFilter}
            showCheck={false}
          />
          </div>
          <div className="min-w-0 sm:w-40">
            <SelectMenu
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            showCheck={false}
          />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/80 sm:p-3">
        <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 sm:size-9"
            title="Previous month"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={openMonthPicker}
              className="min-h-8 w-full truncate rounded-md px-2 text-center text-xs font-semibold text-slate-950 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 dark:text-white dark:hover:bg-slate-950 dark:focus:ring-teal-500/20 sm:min-h-9 sm:text-sm"
              title="Choose month and year"
            >
              {monthLabel}
            </button>
            {monthPickerOpen && (
              <div className="absolute left-1/2 top-10 z-40 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <SelectMenu
                    value={pickerYear}
                    options={yearOptions}
                    onChange={setPickerYear}
                    showCheck={false}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {MONTH_LABELS.map((month, index) => {
                    const active = monthDate.getFullYear() === pickerYear && monthDate.getMonth() === index;
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => selectMonth(index)}
                        className={`min-h-9 rounded-md text-xs font-semibold transition ${
                          active
                            ? 'bg-teal-500 text-slate-950'
                            : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-teal-500/10 dark:hover:text-teal-200'
                        }`}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 sm:size-9"
            title="Next month"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={selectToday}
          className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-medium text-white transition hover:bg-slate-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400 sm:min-h-9 sm:gap-2"
        >
          <Clock3 size={14} aria-hidden="true" />
          Today
        </button>
      </div>

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            Loading calendar
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              {DAY_LABELS.map(label => (
                <div key={label} className="px-0.5 py-1.5 text-center text-[0.56rem] font-semibold uppercase text-slate-500 dark:text-slate-400 sm:px-2 sm:py-2 sm:text-[0.68rem]">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((date, index) => {
                const key = date ? getDateKeyFromDate(date) : `blank-${index}`;
                const dayPosts = date ? postsByDay[key] || [] : [];
                const selected = key === selectedDateKey;
                const today = date && key === getDateKeyFromDate(new Date());

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!date}
                    onClick={() => setSelectedDateKey(key)}
                    className={`aspect-square min-h-0 border-b border-r border-slate-100 p-1 text-left transition dark:border-slate-800 sm:aspect-auto sm:min-h-32 sm:p-2 ${
                      date
                        ? 'bg-white hover:bg-teal-50/70 dark:bg-slate-900 dark:hover:bg-teal-500/10'
                        : 'cursor-default bg-slate-50/80 dark:bg-slate-950/70'
                    } ${selected ? 'ring-2 ring-inset ring-teal-500' : ''}`}
                  >
                    {date && (
                      <div className="flex h-full min-w-0 flex-col gap-1 sm:gap-2">
                        <div className={`grid size-5 place-items-center rounded-md text-[0.65rem] font-semibold sm:size-7 sm:text-xs ${
                          today
                            ? 'bg-slate-950 text-white dark:bg-teal-500 dark:text-slate-950'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="min-w-0 sm:hidden">
                          {dayPosts.length > 0 && (
                            <div className="mt-auto flex flex-wrap items-center gap-0.5">
                              {dayPosts.slice(0, 3).map(post => (
                                <span
                                  key={post.id}
                                  className={`size-1.5 rounded-full ${statusStyles[post.status] || statusStyles.draft}`}
                                />
                              ))}
                              {dayPosts.length > 3 && (
                                <span className="text-[0.55rem] font-semibold leading-none text-teal-700 dark:text-teal-300">
                                  +{dayPosts.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="hidden min-w-0 space-y-1 sm:block">
                          {dayPosts.slice(0, 3).map(post => (
                            <div key={post.id} className="flex min-w-0 items-center gap-1.5 rounded-md bg-slate-50 px-1.5 py-1 dark:bg-slate-950">
                              <span className={`size-2 shrink-0 rounded-full ${statusStyles[post.status] || statusStyles.draft}`} />
                              <span className="truncate text-[0.68rem] font-medium capitalize text-slate-700 dark:text-slate-300">
                                {formatTime(getPostDate(post)) || post.platform} {post.platform}
                              </span>
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <div className="text-[0.68rem] font-semibold text-teal-700 dark:text-teal-300">
                              +{dayPosts.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Selected day</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                    {new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString([], {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                </div>
                <div className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  {selectedPosts.length} posts
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(statusStyles).map(([status, colorClass]) => (
                  <span key={status} className="inline-flex items-center gap-1.5 text-[0.68rem] capitalize text-slate-500 dark:text-slate-400">
                    <span className={`size-2 rounded-full ${colorClass}`} />
                    {status.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {selectedPosts.length === 0 ? (
              <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-teal-50/70 p-6 text-center dark:border-slate-700 dark:from-slate-900 dark:to-teal-950/40">
                <div>
                  <div className="mx-auto grid size-10 place-items-center rounded-lg bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
                    <Sparkles size={18} aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">No posts on this day</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                    Schedule an approved post from the Posts tab to place it on the calendar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-3">
                {selectedPosts.map(post => (
                  <PostCard key={post.id} post={post} brand={brand} onRefresh={fetchPosts} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
