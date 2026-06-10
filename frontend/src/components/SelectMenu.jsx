import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function SelectMenu({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const selected = options.find(option => option.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className="inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950 dark:focus:ring-teal-500/20"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} size={16} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 min-w-0 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-950">
          {options.map(option => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-9 w-full min-w-0 items-center justify-between gap-2 rounded px-2.5 text-left text-sm transition ${
                  active
                    ? 'bg-teal-50 text-slate-950 dark:bg-teal-500/15 dark:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="shrink-0 text-teal-600 dark:text-teal-300" size={15} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
