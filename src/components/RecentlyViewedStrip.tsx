import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import type { Product } from '../types/index.ts';

interface RecentlyViewedStripProps {
  products: Product[];
  excludeId?: string;
}

export const RecentlyViewedStrip: React.FC<RecentlyViewedStripProps> = ({
  products,
  excludeId,
}) => {
  const t = useT();
  const recentlyViewed = useAppStore((s) => s.recentlyViewed);

  const items = React.useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return recentlyViewed
      .filter((id) => id !== excludeId)
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 6);
  }, [products, recentlyViewed, excludeId]);

  if (items.length === 0) return null;

  return (
    <section aria-label={t.shopping.recentlyViewed} className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
            <Clock className="h-3.5 w-3.5" />
            <span>{t.shopping.recentlyViewedSub}</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">
            {t.shopping.recentlyViewed}
          </h2>
        </div>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/product/${item.slug}`}
            className="group flex w-60 shrink-0 flex-col overflow-hidden rounded-2xl border border-black/8 bg-white/95 transition hover:-translate-y-0.5 hover:border-[#7C3AED]/40 hover:shadow-md sm:w-auto dark:border-white/10 dark:bg-[#16161D]/95"
          >
            <div className="aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-[#1E1E28]">
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-3.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="truncate">{item.category}</span>
                <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {item.rating}
                </span>
              </div>
              <h3 className="mt-1 line-clamp-1 font-display text-sm font-bold text-[#111116] group-hover:text-[#7C3AED] dark:text-[#F5F5F7] dark:group-hover:text-[#A78BFA]">
                {item.name}
              </h3>
              <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
                <span className="font-display text-base font-extrabold tabular-nums">
                  Rs {item.basePrice}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t.shopping.taxIncluded}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
