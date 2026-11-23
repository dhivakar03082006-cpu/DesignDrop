import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeftRight, ShoppingBag, Star, X, Zap, Palette } from 'lucide-react';
import { api } from '../lib/api.ts';
import { getPrintOptionsLabel } from '../lib/pricing.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { useMotionEnabled } from './MotionPrimitives.tsx';
import type { Product } from '../types/index.ts';

export const CompareTrayAndModal: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const motionEnabled = useMotionEnabled();

  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const compareModalOpen = useAppStore((s) => s.compareModalOpen);
  const setCompareModalOpen = useAppStore((s) => s.setCompareModalOpen);
  const addToCart = useAppStore((s) => s.addToCart);

  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    if (compareIds.length === 0 || catalog.length > 0) return;
    api.getProducts().then(setCatalog).catch(() => {});
  }, [compareIds.length, catalog.length]);

  useEffect(() => {
    if (!compareModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCompareModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [compareModalOpen, setCompareModalOpen]);

  const selectedProducts = useMemo(() => {
    const map = new Map(catalog.map((p) => [p.id, p]));
    return compareIds.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
  }, [catalog, compareIds]);

  const lowestPrice = useMemo(() => {
    if (selectedProducts.length < 2) return null;
    return Math.min(...selectedProducts.map((p) => p.basePrice));
  }, [selectedProducts]);

  const buildCartItem = (product: Product) => {
    const color = product.colors[0] || { name: 'Charcoal Black', hex: '#18181B' };
    return {
      id: `cart-${product.id}-${color.name}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productType: product.productType,
      imageUrl: product.imageUrl,
      colorName: color.name,
      colorHex: color.hex,
      size: product.sizes[0] || 'M',
      printArea: (product.productType === 'mug' ? 'wrap' : 'front') as 'wrap' | 'front',
      quantity: 1,
      unitPrice: product.basePrice,
    };
  };

  const handleBuyNow = (product: Product) => {
    addToCart(buildCartItem(product), undefined, { openDrawer: false, silentToast: true });
    setCompareModalOpen(false);
    navigate('/checkout');
  };

  const handleAddToCart = (product: Product) => {
    addToCart(buildCartItem(product));
    setCompareModalOpen(false);
  };

  return (
    <>
      {/* Compact Floating Compare Tray (bottom-left, clear of right-side Help button & mobile nav) */}
      <AnimatePresence>
        {selectedProducts.length > 0 && !compareModalOpen && (
          <motion.div
            key="compare-tray"
            initial={motionEnabled ? { opacity: 0, y: 24, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={motionEnabled ? { opacity: 0, y: 20, scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-18 left-3 z-30 flex max-w-[calc(100vw-88px)] items-center gap-2.5 rounded-2xl border border-black/12 bg-white/95 px-3 py-2 text-[#111116] shadow-2xl backdrop-blur-md sm:left-5 md:bottom-5 dark:border-white/15 dark:bg-[#16161F]/95 dark:text-[#F5F5F7]"
          >
            <div className="flex items-center gap-1.5">
              {selectedProducts.map((p) => (
                <div key={p.id} className="relative">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 rounded-lg border border-black/10 object-cover dark:border-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => toggleCompare(p.id)}
                    aria-label={`${t.shopping.remove} ${p.name}`}
                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-white shadow dark:bg-white dark:text-black"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#7C3AED] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[#6D28D9] whitespace-nowrap shrink-0"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>
                {t.shopping.compareNow} ({selectedProducts.length}/3)
              </span>
            </button>

            <button
              type="button"
              onClick={clearCompare}
              aria-label={t.shopping.clearAll}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-black/5 hover:text-[#111116] dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-Side Compare Modal */}
      <AnimatePresence>
        {compareModalOpen && selectedProducts.length > 0 && (
          <motion.div
            key="compare-modal-backdrop"
            initial={motionEnabled ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={motionEnabled ? { opacity: 0 } : undefined}
            transition={{ duration: 0.18 }}
            onClick={() => setCompareModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-[3px] sm:p-5"
          >
            <motion.div
              key="compare-modal-panel"
              initial={motionEnabled ? { opacity: 0, scale: 0.96, y: 12 } : false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={motionEnabled ? { opacity: 0, scale: 0.96, y: 10 } : undefined}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-black/10 bg-white p-5 text-[#111116] shadow-2xl sm:p-7 dark:border-white/10 dark:bg-[#14141B] dark:text-[#F5F5F7]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>{selectedProducts.length} / 3</span>
                  </div>
                  <h2 id="compare-modal-title" className="mt-1 font-display text-xl font-extrabold sm:text-2xl">
                    {t.shopping.compareTitle}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {t.shopping.compareSubtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearCompare}
                    className="min-h-[40px] rounded-xl border border-black/15 px-3 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10 whitespace-nowrap shrink-0"
                  >
                    {t.shopping.clearAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareModalOpen(false)}
                    aria-label="Close compare modal"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10">
                      <th className="w-36 pb-4 pr-3 align-bottom text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Item
                      </th>
                      {selectedProducts.map((product) => (
                        <th key={product.id} className="w-1/3 pb-4 px-2.5 align-top">
                          <div className="relative overflow-hidden rounded-2xl border border-black/8 bg-zinc-50 dark:border-white/10 dark:bg-[#1B1B24]">
                            <button
                              type="button"
                              onClick={() => toggleCompare(product.id)}
                              aria-label={`${t.shopping.remove} ${product.name}`}
                              className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#111116] shadow hover:bg-red-500 hover:text-white dark:bg-[#14141B]/90 dark:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/product/${product.slug}`}
                              onClick={() => setCompareModalOpen(false)}
                              className="block aspect-[4/3] overflow-hidden"
                            >
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            </Link>
                          </div>
                          <Link
                            to={`/product/${product.slug}`}
                            onClick={() => setCompareModalOpen(false)}
                            className="mt-2.5 block font-display text-sm font-bold leading-snug hover:text-[#7C3AED] dark:hover:text-[#A78BFA]"
                          >
                            {product.name}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/8 dark:divide-white/8">
                    <tr>
                      <td className="py-3.5 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {t.shopping.specPrice}
                      </td>
                      {selectedProducts.map((p) => {
                        const isLowest = lowestPrice !== null && p.basePrice === lowestPrice;
                        return (
                          <td key={p.id} className="px-2.5 py-3.5">
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-lg font-extrabold tabular-nums">
                                Rs {p.basePrice}
                              </span>
                              {isLowest && (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  Best value
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {t.shopping.taxIncluded}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {t.shopping.specMaterial}
                      </td>
                      {selectedProducts.map((p) => (
                        <td key={p.id} className="px-2.5 py-3.5 font-medium">
                          {p.material}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {t.shopping.specRating}
                      </td>
                      {selectedProducts.map((p) => (
                        <td key={p.id} className="px-2.5 py-3.5 tabular-nums">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {p.rating}
                          </span>{' '}
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            ({p.reviewCount})
                          </span>
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {t.shopping.specPrintOptions}
                      </td>
                      {selectedProducts.map((p) => (
                        <td key={p.id} className="px-2.5 py-3.5 font-medium text-[#7C3AED] dark:text-[#A78BFA]">
                          {getPrintOptionsLabel(p.productType)}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {t.shopping.specSizes}
                      </td>
                      {selectedProducts.map((p) => (
                        <td key={p.id} className="px-2.5 py-3.5 text-xs font-medium">
                          {p.sizes.join(', ')}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {t.shopping.specColors}
                      </td>
                      {selectedProducts.map((p) => (
                        <td key={p.id} className="px-2.5 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {p.colors.map((c) => (
                              <span
                                key={c.name}
                                title={c.name}
                                className="h-4 w-4 rounded-full border border-black/20 dark:border-white/25"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              ({p.colors.length})
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {t.shopping.specStock}
                      </td>
                      {selectedProducts.map((p) => (
                        <td key={p.id} className="px-2.5 py-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {t.shopping.inStock} ({p.stock})
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="pt-4 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Actions
                      </td>
                      {selectedProducts.map((p) => (
                        <td key={p.id} className="px-2.5 pt-4 align-top">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handleBuyNow(p)}
                              className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#FF5A5F] px-3 text-xs font-semibold text-white hover:bg-[#e54b50]"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              {t.shopping.buyNow}
                            </button>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-xl bg-[#7C3AED] px-2.5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                              >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                {t.common.addToCart}
                              </button>
                              <Link
                                to={`/studio?product=${p.productType}&id=${p.id}`}
                                onClick={() => setCompareModalOpen(false)}
                                className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl border border-black/15 px-2.5 text-xs font-semibold hover:border-[#7C3AED] dark:border-white/15"
                              >
                                <Palette className="h-3.5 w-3.5" />
                                {t.shopping.design}
                              </Link>
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
