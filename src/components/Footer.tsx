import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Zap, Globe, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { DesignDropLogo } from './DesignDropLogo.tsx';
import type { Language } from '../i18n/translations.ts';

export const Footer: React.FC = () => {
  const t = useT();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const liteMode = useAppStore((s) => s.liteMode);
  const setLiteMode = useAppStore((s) => s.setLiteMode);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <footer className="mt-24 border-t border-black/10 bg-white pb-20 md:pb-12 dark:border-white/10 dark:bg-[#09090D]">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <Link to="/" aria-label="DesignDrop Home" className="group inline-flex items-center">
              <DesignDropLogo size="lg" />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Flagship custom T-shirts, glazed ceramic mugs, heavyweight hoodies, and curved caps printed to order in 300 DPI. Every price includes 18% GST tax with zero hidden fees.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-black/12 px-3.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/12 dark:hover:bg-white/10"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#7C3AED]" />}
                {theme === 'dark' ? t.common.lightMode : t.common.darkMode}
              </button>

              <button
                type="button"
                onClick={() => setLiteMode(!liteMode)}
                aria-pressed={liteMode}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
                  liteMode
                    ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]'
                    : 'border-black/12 hover:bg-black/5 dark:border-white/12 dark:hover:bg-white/10'
                }`}
              >
                <Zap className="h-4 w-4" />
                {t.common.liteMode}: {liteMode ? 'On' : 'Off'}
              </button>

              <label className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-black/12 px-3 text-sm font-medium dark:border-white/12">
                <Globe className="h-4 w-4 text-zinc-500" />
                <span className="sr-only">{t.common.language}</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  aria-label={t.common.language}
                  className="bg-transparent text-sm font-medium focus:outline-none dark:bg-[#09090D]"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </label>

              <PWAInstallButton />
            </div>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Shop & Create
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <li><Link to="/shop" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">Browse All Products</Link></li>
              <li><Link to="/studio" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">Design Studio (3D)</Link></li>
              <li><Link to="/wishlist" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">Saved Wishlist</Link></li>
              <li><Link to="/track" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">Track My Order</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Help & Studio
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <li><Link to="/help" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">FAQ & Help Center</Link></li>
              <li><Link to="/help#returns" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">Returns & Refunds</Link></li>
              <li><Link to="/account" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">My Account</Link></li>
              <li><Link to="/admin" className="transition hover:text-[#7C3AED] dark:hover:text-[#A78BFA]">Store Admin Panel</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-black/8 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center dark:border-white/8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>UPI · Cards · Cash on Delivery · Instant PDF GST Invoice</span>
          </div>
          <p>© {new Date().getFullYear()} DesignDrop Print Studio · support@designdrop.in</p>
        </div>
      </div>
    </footer>
  );
};
