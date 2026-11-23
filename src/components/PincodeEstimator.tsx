import React, { useEffect, useState } from 'react';
import { MapPin, Truck, Zap, CheckCircle2, Package } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { estimatePincodeDelivery, type PincodeEstimate } from '../lib/pricing.ts';

const STORAGE_KEY = 'designdrop-last-pincode';

export const PincodeEstimator: React.FC = () => {
  const t = useT();
  const language = useAppStore((s) => s.language);
  const [pincode, setPincode] = useState('');
  const [estimate, setEstimate] = useState<PincodeEstimate | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && /^[1-9][0-9]{5}$/.test(saved)) {
        setPincode(saved);
        setEstimate(estimatePincodeDelivery(saved, language));
      }
    } catch {
      // Ignore storage access errors in private mode
    }
  }, [language]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const res = estimatePincodeDelivery(pincode, language);
    if (!res) {
      setEstimate(null);
      setError(t.shopping.invalidPincode);
      return;
    }
    setError('');
    setEstimate(res);
    try {
      localStorage.setItem(STORAGE_KEY, res.pincode);
    } catch {
      // Ignore storage access errors
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-black/10 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-[#1B1B24]/80">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#111116] dark:text-[#F5F5F7]">
        <MapPin className="h-4 w-4 text-[#7C3AED] dark:text-[#A78BFA]" />
        <span>{t.shopping.checkDeliveryTitle}</span>
      </div>

      <form onSubmit={handleCheck} className="mt-2.5 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
            setPincode(digits);
            if (error) setError('');
          }}
          placeholder={t.shopping.pincodePlaceholder}
          aria-label={t.shopping.checkDeliveryTitle}
          className="min-h-[44px] flex-1 rounded-xl border border-black/15 bg-white px-3.5 text-sm font-medium tabular-nums text-[#111116] placeholder:text-zinc-400 focus:border-[#7C3AED] focus:outline-none dark:border-white/15 dark:bg-[#14141B] dark:text-[#F5F5F7]"
        />
        <button
          type="submit"
          className="min-h-[44px] rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-[#111116] dark:hover:bg-zinc-200 whitespace-nowrap shrink-0"
        >
          {t.shopping.checkBtn}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-500" role="alert">
          {error}
        </p>
      )}

      {estimate && (
        <div className="mt-3.5 space-y-2 border-t border-black/8 pt-3 text-xs dark:border-white/10">
          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
              {t.shopping.expectedDispatch}
            </span>
            <strong className="font-semibold text-[#111116] dark:text-[#F5F5F7]">
              {estimate.dispatchDate}
            </strong>
          </div>

          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-emerald-500" />
              {t.shopping.standardDelivery} ({t.shopping.freeOver599})
            </span>
            <strong className="font-semibold text-[#111116] dark:text-[#F5F5F7]">
              {estimate.standardRange}
            </strong>
          </div>

          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {t.shopping.expressDelivery}
            </span>
            <strong className="font-semibold text-[#111116] dark:text-[#F5F5F7]">
              {estimate.expressDate}
            </strong>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <span className="inline-flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t.shopping.codAvailable}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              PIN {estimate.pincode} · {estimate.zoneName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
