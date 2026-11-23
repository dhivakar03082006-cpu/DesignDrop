import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  label: string;
  text: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ label, text }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        aria-label={label}
        aria-expanded={open}
        className="ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-[#7C3AED] dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-[#A78BFA]"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 rounded-xl border border-black/10 bg-white p-3 text-xs leading-relaxed text-[#111116] shadow-xl dark:border-white/15 dark:bg-[#1E1E28] dark:text-[#F5F5F7]"
        >
          {text}
        </span>
      )}
    </span>
  );
};
