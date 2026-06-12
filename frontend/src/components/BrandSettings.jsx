import { useEffect, useState } from 'react';
import { BadgeCheck, Building2, Plus, Save, Trash2 } from 'lucide-react';
import { createBrand, deleteBrand, updateBrand } from '../api';
import ConfirmDialog from './ConfirmDialog';

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'twitter'];

const emptyBusiness = {
  company_name: '',
  industry: 'general',
  tone: 'professional',
  target_audience: 'customers, followers, and potential buyers',
  brand_voice: 'clear, trustworthy, and engaging',
  topics: 'product updates, educational tips, community stories, offers',
  hashtags: '#Business #SocialMedia #Marketing',
  enabled_platforms: 'instagram,facebook',
};

export default function BrandSettings({ brands, selectedBrand, onSelectBrand, onBrandsChange }) {
  const [form, setForm] = useState(emptyBusiness);
  const [mode, setMode] = useState('edit');
  const [saved, setSaved] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (mode === 'new') return;
    queueMicrotask(() => setForm(selectedBrand || emptyBusiness));
  }, [selectedBrand, mode]);

  const startNewBusiness = () => {
    setMode('new');
    setForm(emptyBusiness);
    setSaved(false);
  };

  const editBusiness = (brand) => {
    setMode('edit');
    onSelectBrand(brand.id);
    setForm(brand);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      alert('Please enter a business name');
      return;
    }
    if (!form.topics.split(',').some(topic => topic.trim())) {
      alert('Please add at least one default content topic');
      return;
    }
    if (!getSelectedPlatforms().length) {
      alert('Please choose at least one platform');
      return;
    }

    const payload = {
      company_name: form.company_name,
      industry: form.industry,
      tone: form.tone,
      target_audience: form.target_audience,
      brand_voice: form.brand_voice,
      topics: form.topics,
      hashtags: form.hashtags,
      enabled_platforms: getSelectedPlatforms().join(','),
    };

    if (mode === 'new') {
      const res = await createBrand(payload);
      setMode('edit');
      await onBrandsChange(res.data.id);
      onSelectBrand(res.data.id);
    } else if (selectedBrand) {
      await updateBrand(selectedBrand.id, payload);
      await onBrandsChange(selectedBrand.id);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteBrand(selectedBrand.id);
      setDeleteDialogOpen(false);
      await onBrandsChange();
      setMode('edit');
    } catch (err) {
      console.error(err);
      setDeleteError(err.response?.data?.detail || 'Unable to delete business');
    } finally {
      setDeleting(false);
    }
  };

  const fields = [
    { key: 'company_name', label: 'Business or Page Name', placeholder: 'Acme Coffee' },
    { key: 'industry', label: 'Industry', placeholder: 'coffee shop, fitness, real estate, SaaS' },
    { key: 'tone', label: 'Tone', placeholder: 'friendly, premium, playful, expert' },
    { key: 'target_audience', label: 'Target Audience', placeholder: 'local customers, founders, parents, investors' },
    { key: 'brand_voice', label: 'Brand Voice', placeholder: 'warm, concise, useful, and community-driven' },
    {
      key: 'topics',
      label: 'Default Content Topics',
      placeholder: 'burger specials, Friday offers, new menu items, customer favorites',
      helper: 'Used by auto-generation and whenever you leave the post topic blank. Separate multiple topics with commas.',
    },
    { key: 'hashtags', label: 'Default Hashtags', placeholder: '#Business #Marketing' },
  ];

  const getSelectedPlatforms = () => (
    (form.enabled_platforms || '')
      .split(',')
      .map(platform => platform.trim().toLowerCase())
      .filter(Boolean)
  );

  const togglePlatform = (platform) => {
    const selected = new Set(getSelectedPlatforms());
    if (selected.has(platform)) {
      selected.delete(platform);
    } else {
      selected.add(platform);
    }
    setForm({ ...form, enabled_platforms: Array.from(selected).join(',') });
  };

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr]">
      <aside className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Workspace</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950 dark:text-white">Businesses</h2>
          </div>
          <button
            onClick={startNewBusiness}
            className="grid size-10 place-items-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
            title="Add business"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:block lg:space-y-2">
          {brands.length === 0 ? (
            <div className="min-w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              Add your first business or page to start creating separate brand memories and post queues.
            </div>
          ) : (
            brands.map(brand => (
              <button
                key={brand.id}
                onClick={() => editBusiness(brand)}
                className={`min-w-0 rounded-md border p-3 text-left transition lg:w-full ${
                  selectedBrand?.id === brand.id && mode !== 'new'
                    ? 'border-teal-200 bg-teal-50 text-slate-950 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <p className="truncate text-sm font-semibold">{brand.company_name}</p>
                <p className="mt-1 truncate text-xs capitalize text-slate-500 dark:text-slate-400">{brand.industry || 'general'}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-950 text-white dark:bg-slate-800">
              <Building2 size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                {mode === 'new' ? 'New business memory' : 'Business memory'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Posts generated for this business will use these settings.</p>
            </div>
          </div>
          {saved && (
            <div className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700">
              <BadgeCheck size={16} aria-hidden="true" />
              Saved
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className={['target_audience', 'brand_voice', 'topics', 'hashtags'].includes(field.key) ? 'md:col-span-2' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
              <input
                type="text"
                value={form[field.key] || ''}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950 dark:focus:ring-teal-500/20"
              />
              {field.helper && (
                <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{field.helper}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Posting Platforms</label>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Choose where this business actually posts. Auto-generation and manual generation will only use these platforms.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLATFORMS.map(platform => {
              const selected = getSelectedPlatforms().includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`min-h-10 shrink-0 rounded-md border px-3 text-sm font-medium capitalize transition ${
                    selected
                      ? 'border-teal-200 bg-teal-600 text-white shadow-sm dark:border-teal-400 dark:bg-teal-500 dark:text-slate-950'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {platform}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleSave}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
          >
            <Save size={17} aria-hidden="true" />
            {mode === 'new' ? 'Create Business' : 'Save Business Memory'}
          </button>
          {selectedBrand && mode !== 'new' && (
            <button
              onClick={() => {
                setDeleteError('');
                setDeleteDialogOpen(true);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 size={17} aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete business?"
        message={`This will permanently delete ${selectedBrand?.company_name || 'this business'}. Businesses with posts cannot be deleted.`}
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
    </div>
  );
}
