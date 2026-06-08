import { useEffect, useState } from 'react';
import { Hash, Image, Loader2, Megaphone, PenLine, Send, Sparkles } from 'lucide-react';
import { generatePost, getMediaUrl } from '../api';

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'twitter'];

const getEnabledPlatforms = (brand) => (
  (brand?.enabled_platforms || 'instagram,facebook')
    .split(',')
    .map(platform => platform.trim().toLowerCase())
    .filter(Boolean)
);

export default function GeneratePost({ brand }) {
  const [form, setForm] = useState({
    platform: 'instagram',
    topic: '',
    brand_voice: 'clear, trustworthy, and engaging',
    hashtags: '#Business #SocialMedia #Marketing',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const enabledPlatforms = getEnabledPlatforms(brand);

  useEffect(() => {
    if (!brand) return;
    queueMicrotask(() => {
      const nextPlatforms = getEnabledPlatforms(brand);
      setForm(current => ({
        ...current,
        platform: nextPlatforms.includes(current.platform) ? current.platform : nextPlatforms[0],
        brand_voice: brand.brand_voice || 'clear, trustworthy, and engaging',
        hashtags: brand.hashtags || '#Business #SocialMedia #Marketing',
      }));
      setResult(null);
    });
  }, [brand]);

  const handleSubmit = async () => {
    if (!brand) return alert('Please add or select a business first');
    setLoading(true);
    try {
      const res = await generatePost({ ...form, brand_id: brand.id });
      setResult(res.data);
    } catch {
      alert('Error generating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">AI Composer</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-2xl">Generate a single post</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Choose a channel, set the topic, and generate content using the selected business memory.
          </p>
        </div>

        <div className="rounded-lg border border-teal-100 bg-teal-50 p-3 dark:border-teal-500/20 dark:bg-teal-500/10 sm:p-4">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                {brand ? brand.company_name : 'No business selected'}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {brand
                  ? `Platforms: ${enabledPlatforms.join(', ')}. Default topics: ${brand.topics || 'Add topics in Businesses'}`
                  : 'Create a business profile first so each post uses the right brand memory.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Megaphone size={15} aria-hidden="true" />
              Platform
            </label>
            <select
              value={form.platform}
              onChange={e => setForm({ ...form, platform: e.target.value })}
              className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950 dark:focus:ring-teal-500/20"
            >
              {PLATFORMS.filter(p => enabledPlatforms.includes(p)).map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <PenLine size={15} aria-hidden="true" />
              Topic
            </label>
            <input
              type="text"
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder="Optional: leave blank to use a default business topic"
              className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950 dark:focus:ring-teal-500/20"
            />
            <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              If blank, the AI will use one of this business's default content topics instead of inventing a random direction.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Sparkles size={15} aria-hidden="true" />
              Brand Voice
            </label>
            <input
              type="text"
              value={form.brand_voice}
              onChange={e => setForm({ ...form, brand_voice: e.target.value })}
              className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950 dark:focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Hash size={15} aria-hidden="true" />
              Hashtags
            </label>
            <input
              type="text"
              value={form.hashtags}
              onChange={e => setForm({ ...form, hashtags: e.target.value })}
              className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950 dark:focus:ring-teal-500/20"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !brand}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
          >
            {loading ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
            {loading ? 'Generating Post' : 'Generate Post'}
          </button>
        </div>

        {result && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Sparkles size={16} aria-hidden="true" />
              Post generated and saved
            </h3>
            <div className="mt-4 space-y-4">
              {result.image_url && (
                <img
                  src={getMediaUrl(result.image_url)}
                  alt={result.image_prompt || 'Generated post visual'}
                  className="aspect-square w-full rounded-md border border-emerald-100 object-cover shadow-sm dark:border-emerald-500/20"
                />
              )}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Caption</p>
                <p className="text-sm leading-6 text-slate-800 dark:text-slate-200">{result.caption}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Hashtags</p>
                <p className="text-sm font-medium text-teal-700">{result.hashtags}</p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Image size={13} aria-hidden="true" />
                  Image Prompt
                </p>
                <p className="text-sm italic leading-6 text-slate-600 dark:text-slate-400">{result.image_prompt}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
