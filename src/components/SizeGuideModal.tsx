import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Ruler, X, Info } from 'lucide-react';
import { useT } from '../hooks/useT.ts';
import { useMotionEnabled } from './MotionPrimitives.tsx';
import type { ProductType } from '../types/index.ts';

export type SizeGuideTab = 'tshirt' | 'hoodie' | 'cap';

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: ProductType;
}

interface GarmentRow {
  size: string;
  chestIn: number;
  lengthIn: number;
  shoulderIn: number;
  fitNote: string;
}

const TSHIRT_ROWS: GarmentRow[] = [
  { size: 'S', chestIn: 38, lengthIn: 27, shoulderIn: 17, fitNote: 'Snug everyday fit' },
  { size: 'M', chestIn: 40, lengthIn: 28, shoulderIn: 18, fitNote: 'Classic regular fit' },
  { size: 'L', chestIn: 42, lengthIn: 29, shoulderIn: 19, fitNote: 'Relaxed regular fit' },
  { size: 'XL', chestIn: 44, lengthIn: 30, shoulderIn: 20, fitNote: 'Roomy comfort fit' },
  { size: 'XXL', chestIn: 46, lengthIn: 31, shoulderIn: 21, fitNote: 'Extra roomy fit' },
];

const HOODIE_ROWS: GarmentRow[] = [
  { size: 'S', chestIn: 40, lengthIn: 26.5, shoulderIn: 18.5, fitNote: 'Easy layer over tee' },
  { size: 'M', chestIn: 42, lengthIn: 27.5, shoulderIn: 19.5, fitNote: 'Cozy regular fit' },
  { size: 'L', chestIn: 44, lengthIn: 28.5, shoulderIn: 20.5, fitNote: 'Relaxed street fit' },
  { size: 'XL', chestIn: 46, lengthIn: 29.5, shoulderIn: 21.5, fitNote: 'Warm roomy fit' },
  { size: 'XXL', chestIn: 48, lengthIn: 30.5, shoulderIn: 22.5, fitNote: 'Oversized cozy fit' },
];

function toUnit(inches: number, unit: 'in' | 'cm'): string {
  if (unit === 'in') return `${inches}"`;
  return `${Math.round(inches * 2.54)} cm`;
}

function resolveTab(productType?: ProductType): SizeGuideTab {
  if (productType === 'hoodie') return 'hoodie';
  if (productType === 'cap') return 'cap';
  return 'tshirt';
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  open,
  onClose,
  defaultTab,
}) => {
  const t = useT();
  const motionEnabled = useMotionEnabled();
  const [tab, setTab] = useState<SizeGuideTab>(resolveTab(defaultTab));
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  useEffect(() => {
    if (open) {
      setTab(resolveTab(defaultTab));
    }
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const rows = tab === 'hoodie' ? HOODIE_ROWS : TSHIRT_ROWS;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="size-guide-backdrop"
          initial={motionEnabled ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={motionEnabled ? { opacity: 0 } : undefined}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
        >
          <motion.div
            key="size-guide-panel"
            initial={motionEnabled ? { opacity: 0, scale: 0.96, y: 12 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={motionEnabled ? { opacity: 0, scale: 0.96, y: 8 } : undefined}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/10 bg-white p-6 text-[#111116] shadow-2xl sm:p-7 dark:border-white/10 dark:bg-[#14141B] dark:text-[#F5F5F7]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                  <Ruler className="h-4 w-4" />
                  <span>{t.shopping.sizeGuide}</span>
                </div>
                <h2 id="size-guide-title" className="mt-1 font-display text-xl font-extrabold sm:text-2xl">
                  {t.shopping.sizeGuideTitle}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {t.shopping.sizeGuideSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close size guide"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Tabs & Unit Toggle */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-[#1E1E28]">
                {(
                  [
                    { id: 'tshirt', label: 'T-Shirts' },
                    { id: 'hoodie', label: 'Hoodies' },
                    { id: 'cap', label: 'Caps' },
                  ] as const
                ).map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`relative min-h-[38px] rounded-lg px-4 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'text-white'
                          : 'text-zinc-700 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId={motionEnabled ? 'size-guide-cat-pill' : undefined}
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-lg bg-[#7C3AED]"
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div
                role="group"
                aria-label="Measurement unit"
                className="inline-flex rounded-xl border border-black/10 bg-zinc-50 p-1 dark:border-white/10 dark:bg-[#1E1E28]"
              >
                {(['in', 'cm'] as const).map((u) => {
                  const active = unit === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`relative min-h-[36px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'text-white'
                          : 'text-zinc-600 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId={motionEnabled ? 'size-guide-unit-pill' : undefined}
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-lg bg-zinc-900 dark:bg-[#7C3AED]"
                        />
                      )}
                      <span className="relative z-10">
                        {u === 'in' ? t.shopping.inches : t.shopping.cm}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="mt-5 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
              {tab === 'cap' ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-100/90 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-[#1E1E28] dark:text-zinc-300">
                    <tr>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Head Around</th>
                      <th className="px-4 py-3">Crown Height</th>
                      <th className="px-4 py-3">Brim Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 dark:divide-white/8">
                    <tr className="bg-white dark:bg-[#14141B]">
                      <td className="px-4 py-3.5 font-bold">One Size (Adjustable)</td>
                      <td className="px-4 py-3.5 tabular-nums">
                        {unit === 'in' ? '21.5" – 23.5"' : '55 – 60 cm'}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums">
                        {unit === 'in' ? '4.5"' : '11.5 cm'}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums">
                        {unit === 'in' ? '2.75"' : '7 cm'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-100/90 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-[#1E1E28] dark:text-zinc-300">
                    <tr>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Chest</th>
                      <th className="px-4 py-3">Length</th>
                      <th className="px-4 py-3">Shoulder</th>
                      <th className="hidden px-4 py-3 sm:table-cell">How it feels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 dark:divide-white/8">
                    {rows.map((row) => (
                      <tr
                        key={row.size}
                        className="bg-white transition-colors hover:bg-[#7C3AED]/5 dark:bg-[#14141B] dark:hover:bg-[#7C3AED]/10"
                      >
                        <td className="px-4 py-3 font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                          {row.size}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {toUnit(row.chestIn, unit)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {toUnit(row.lengthIn, unit)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {toUnit(row.shoulderIn, unit)}
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-zinc-500 sm:table-cell dark:text-zinc-400">
                          {row.fitNote}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Plain-language measurement tips */}
            <div className="mt-5 rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/6 p-4 dark:bg-[#7C3AED]/10">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                <Info className="h-4 w-4 shrink-0" />
                <span>{t.shopping.howToMeasure}</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                {tab === 'cap' ? (
                  <li>• {t.shopping.measureTipCap}</li>
                ) : (
                  <>
                    <li>• {t.shopping.measureTipChest}</li>
                    <li>• {t.shopping.measureTipLength}</li>
                  </>
                )}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
