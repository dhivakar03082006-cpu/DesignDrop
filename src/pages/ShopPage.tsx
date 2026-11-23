import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, X, Percent, Truck } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { ProductCardSkeleton } from '../components/Skeleton.tsx';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip.tsx';
import { useMotionEnabled } from '../components/MotionPrimitives.tsx';
import type { Product } from '../types/index.ts';

const COLOR_FAMILIES = [
  { id: 'all', label: 'Any', hex: 'transparent', keywords: [] as string[] },
  { id: 'black', label: 'Black', hex: '#18181B', keywords: ['black', 'charcoal', 'onyx', 'graphite', 'jet', 'obsidian', 'slate'] },
  { id: 'white', label: 'White', hex: '#F5F3EE', keywords: ['white', 'ivory', 'cream', 'snow', 'pearl', 'porcelain', 'ceramic'] },
  { id: 'violet', label: 'Violet', hex: '#7C3AED', keywords: ['violet', 'purple', 'lavender', 'plum', 'lilac'] },
  { id: 'red', label: 'Coral / Red', hex: '#FF5A5F', keywords: ['coral', 'red', 'crimson', 'maroon', 'rose', 'terracotta', 'blush', 'rust'] },
  { id: 'blue', label: 'Blue / Navy', hex: '#2563EB', keywords: ['blue', 'navy', 'cobalt', 'teal', 'denim', 'sky', 'indigo', 'ocean'] },
  { id: 'green', label: 'Green', hex: '#4B6B58', keywords: ['green', 'sage', 'olive', 'forest', 'emerald', 'mint', 'moss'] },
  { id: 'sand', label: 'Sand / Beige', hex: '#D6C7B2', keywords: ['sand', 'beige', 'khaki', 'oat', 'tan', 'stone', 'clay', 'amber', 'mustard', 'gold'] },
];

export const ShopPage: React.FC = () => {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const liteMode = useAppStore((s) => s.liteMode);
  const motionEnabled = useMotionEnabled();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'newest'>('popular');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const materials = useMemo(
    () => Array.from(new Set(products.map((p) => p.material))),
    [products]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5);
  }, [products, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const colorFamily = COLOR_FAMILIES.find((c) => c.id === selectedColor);
    let list = products.filter((p) => {
      if (category !== 'all' && p.categorySlug !== category) return false;
      if (p.basePrice < minPrice || p.basePrice > maxPrice) return false;
      if (minRating > 0 && p.rating < minRating) return false;
      if (selectedSize !== 'all' && !p.sizes.includes(selectedSize)) return false;
      if (selectedMaterial !== 'all' && p.material !== selectedMaterial) return false;
      if (colorFamily && colorFamily.id !== 'all') {
        const hasMatch = p.colors.some((c) =>
          colorFamily.keywords.some((kw) => c.name.toLowerCase().includes(kw))
        );
        if (!hasMatch) return false;
      }
      if (q && !p.name.toLowerCase().includes(q) && !p.shortDescription.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.basePrice - a.basePrice);
    else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => {
        const numA = Number(a.id.replace(/\D/g, '')) || 0;
        const numB = Number(b.id.replace(/\D/g, '')) || 0;
        return numB - numA;
      });
    } else {
      list = [...list].sort(
        (a, b) => Number(b.trending) - Number(a.trending) || b.rating - a.rating
      );
    }

    return list;
  }, [products, category, minPrice, maxPrice, selectedColor, minRating, selectedSize, selectedMaterial, query, sortBy]);

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) +
    (minPrice > 0 || maxPrice < 2000 ? 1 : 0) +
    (selectedColor !== 'all' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (selectedSize !== 'all' ? 1 : 0) +
    (selectedMaterial !== 'all' ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const clearAll = () => {
    setQuery('');
    setCategory('all');
    setMinPrice(0);
    setMaxPrice(2000);
    setSelectedColor('all');
    setMinRating(0);
    setSelectedSize('all');
    setSelectedMaterial('all');
    setSortBy('popular');
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Shop Blank & Custom Items
          </h1>
          <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
            All prices include 18% GST tax. Free delivery over Rs 599.
          </p>
        </div>

        {/* Search with live suggestions */}
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute top-3.5 left-3.5 h-5 w-5 text-zinc-400" />
          <input
            type="search"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search T-shirts, mugs, hoodies..."
            aria-label="Search products"
            className="min-h-[48px] w-full rounded-xl border border-black/15 bg-white pr-4 pl-11 text-base dark:border-white/15 dark:bg-[#16161D]"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/15 dark:bg-[#16161D]">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      setQuery(s.name);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <span>{s.name}</span>
                    <span className="font-semibold tabular-nums">Rs {s.basePrice}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bundle & Free Delivery Offer Strip */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-r from-[#7C3AED]/10 via-[#7C3AED]/5 to-[#FF5A5F]/10 px-4 py-3 text-xs font-semibold sm:px-5 sm:text-sm dark:border-[#7C3AED]/30">
        <span className="inline-flex items-center gap-2 text-[#6D28D9] dark:text-[#C4B5FD]">
          <Percent className="h-4 w-4 shrink-0" />
          {t.shopping.bundleBanner}
        </span>
        <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <Truck className="h-4 w-4 shrink-0 text-emerald-500" />
          {t.shopping.freeOver599} · {t.shopping.taxIncluded}
        </span>
      </div>

      {/* Category & Filter Bar */}
      <div className="studio-card mt-5 rounded-2xl border border-black/10 bg-white/92 p-4 backdrop-blur-md sm:p-5 dark:border-white/10 dark:bg-[#16161D]/92">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-zinc-100/90 p-1.5 dark:bg-[#1E1E28]">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'tshirts', label: 'T-Shirts' },
              { id: 'mugs', label: 'Mugs' },
              { id: 'hoodies', label: 'Hoodies' },
              { id: 'caps', label: 'Caps' },
            ].map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`relative min-h-[42px] rounded-xl px-4 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-white'
                      : 'text-zinc-700 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={motionEnabled ? 'shop-category-pill' : undefined}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl bg-[#7C3AED] shadow-sm shadow-[#7C3AED]/30"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label="Filter by customer rating"
              className="min-h-[42px] rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15 dark:bg-[#16161D]"
            >
              <option value={0}>{t.enhancements.anyRating}</option>
              <option value={4.7}>4.7★ & above</option>
              <option value={4.8}>4.8★ & above</option>
              <option value={4.9}>4.9★ Top Rated</option>
            </select>

            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              aria-label="Filter by size"
              className="min-h-[42px] rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15 dark:bg-[#16161D]"
            >
              <option value="all">Any Size</option>
              <option value="S">Size S</option>
              <option value="M">Size M</option>
              <option value="L">Size L</option>
              <option value="XL">Size XL</option>
              <option value="11 oz">Mug 11 oz</option>
              <option value="15 oz">Mug 15 oz</option>
            </select>

            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              aria-label="Filter by fabric or material"
              className="min-h-[42px] rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15 dark:bg-[#16161D]"
            >
              <option value="all">Any Material</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort products"
              className="min-h-[42px] rounded-xl border border-black/15 bg-transparent px-3 text-sm font-medium dark:border-white/15 dark:bg-[#16161D]"
            >
              <option value="popular">Sort: Featured & Popular</option>
              <option value="newest">Sort: {t.enhancements.sortNewest}</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Second Row: Price Range + Color Swatches + Active Filter Reset */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-4 dark:border-white/8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#7C3AED]" />
              Price
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'All', min: 0, max: 2000 },
                { label: 'Under Rs 500', min: 0, max: 500 },
                { label: 'Rs 500–999', min: 500, max: 999 },
                { label: 'Rs 1,000+', min: 1000, max: 2000 },
              ].map((range) => {
                const active = minPrice === range.min && maxPrice === range.max;
                return (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(range.min);
                      setMaxPrice(range.max);
                    }}
                    className={`min-h-[34px] rounded-lg border px-2.5 text-xs font-semibold transition ${
                      active
                        ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]'
                        : 'border-black/12 text-zinc-600 hover:border-[#7C3AED]/40 dark:border-white/12 dark:text-zinc-300'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
            <label className="hidden items-center gap-2 text-xs font-medium text-zinc-500 sm:inline-flex">
              <span>Max Rs {maxPrice}</span>
              <input
                type="range"
                min={350}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxPrice(val);
                  if (minPrice > val) setMinPrice(0);
                }}
                aria-label="Maximum price"
                className="w-24 accent-[#7C3AED]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t.enhancements.filterColor}:
            </span>
            {COLOR_FAMILIES.map((cf) => {
              const active = selectedColor === cf.id;
              return (
                <button
                  key={cf.id}
                  type="button"
                  onClick={() => setSelectedColor(cf.id)}
                  title={cf.label}
                  className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition ${
                    active
                      ? 'border-[#7C3AED] bg-[#7C3AED]/12 text-[#7C3AED] dark:text-[#A78BFA]'
                      : 'border-black/12 text-zinc-600 hover:border-[#7C3AED]/40 dark:border-white/12 dark:text-zinc-300'
                  }`}
                >
                  {cf.id !== 'all' && (
                    <span
                      className="h-3 w-3 rounded-full border border-black/20"
                      style={{ backgroundColor: cf.hex }}
                    />
                  )}
                  <span>{cf.id === 'all' ? t.enhancements.anyColor : cf.label}</span>
                </button>
              );
            })}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-red-500/10 px-3 text-xs font-semibold text-red-600 hover:bg-red-500/15 dark:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
                Reset ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-[#16161D]">
          <h2 className="font-display text-xl font-bold">No items match those filters.</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Try clearing your search or raising the price limit to see all items.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white"
          >
            <X className="h-4 w-4" />
            Show All Items
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>
              Showing <strong className="text-[#111116] dark:text-[#F5F5F7]">{Math.min(visibleCount, filtered.length)}</strong> of{' '}
              <strong className="text-[#111116] dark:text-[#F5F5F7]">{filtered.length}</strong> custom blanks
            </span>
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visibleCount).map((product, idx) => (
              <motion.div
                key={product.id}
                initial={liteMode ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: liteMode ? 0 : (idx % 3) * 0.06, duration: 0.38 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + 8)}
                className="min-h-[48px] rounded-xl border border-black/15 px-8 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Show More Items ({filtered.length - visibleCount} left)
              </button>
            </div>
          )}
        </>
      )}

      {/* Recently Viewed Strip */}
      <RecentlyViewedStrip products={products} />
    </div>
  );
};
