import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useT } from '../hooks/useT.ts';

export const OfflinePage: React.FC = () => {
  const t = useT();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-extrabold">{t.common.offlineBanner}</h1>
      <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
        Your saved designs and cart items are still safe on this device. Reconnect to place your order.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
};
