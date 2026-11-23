import React from 'react';

export const ProductCardSkeleton: React.FC = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]">
    <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    <div className="mt-4 h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    <div className="mt-2 h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    <div className="mt-6 flex items-center justify-between">
      <div className="h-6 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-11 w-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  </div>
);
