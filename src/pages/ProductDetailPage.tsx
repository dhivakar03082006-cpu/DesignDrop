import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Palette,
  RotateCw,
  Ruler,
  Zap,
  ArrowLeftRight,
  Percent,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { HelpTooltip } from '../components/HelpTooltip.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { SizeGuideModal } from '../components/SizeGuideModal.tsx';
import { PincodeEstimator } from '../components/PincodeEstimator.tsx';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip.tsx';
import {
  AnimatedNumber,
  MagneticWrapper,
  WishlistBurstButton,
  useMotionEnabled,
} from '../components/MotionPrimitives.tsx';
import type { LightingMood } from '../components/three/Product3DViewer.tsx';
import type { Product, Review } from '../types/index.ts';

const Product3DViewer = lazy(() =>
  import('../components/three/Product3DViewer.tsx').then((m) => ({ default: m.Product3DViewer }))
);

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const motionEnabled = useMotionEnabled();
  const addToCart = useAppStore((s) => s.addToCart);
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const wishlist = useAppStore((s) => s.wishlist);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const recordRecentlyViewed = useAppStore((s) => s.recordRecentlyViewed);
  const showToast = useAppStore((s) => s.showToast);

  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [cameraPreset, setCameraPreset] = useState<'front' | 'back' | 'side'>('front');
  const [autoSpin, setAutoSpin] = useState(false);
  const [lightingMood, setLightingMood] = useState<LightingMood>('daylight');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .getProducts()
      .then((list) => {
        setProducts(list);
        const found = list.find((p) => p.slug === slug) || list[0];
        if (found) {
          setSelectedSize(found.sizes[0] || 'M');
          setSelectedColorIdx(0);
          setQuantity(1);
          recordRecentlyViewed(found.id);
          api.getReviews(found.id).then(setReviews);
        }
      })
      .finally(() => setLoading(false));
  }, [slug, recordRecentlyViewed]);

  const product = products.find((p) => p.slug === slug) || products[0];

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="h-[440px] animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">We could not find that product.</h1>
        <Link
          to="/shop"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const activeColor = product.colors[selectedColorIdx] || product.colors[0];
  const isSaved = wishlist.includes(product.id);
  const isComparing = compareIds.includes(product.id);
  const isBundleEligible = product.productType === 'tshirt' || product.productType === 'mug';
  const related = products
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, 3);

  const buildCartPayload = () => ({
    id: `cart-${product.id}-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    productType: product.productType,
    imageUrl: product.imageUrl,
    colorName: activeColor.name,
    colorHex: activeColor.hex,
    size: selectedSize,
    printArea: (product.productType === 'mug' ? 'wrap' : 'front') as 'wrap' | 'front',
    quantity,
    unitPrice: product.basePrice,
  });

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    addToCart(buildCartPayload(), {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const handleBuyNow = () => {
    addToCart(buildCartPayload(), undefined, { openDrawer: false, silentToast: true });
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      showToast('Please enter your name and a short review.', 'error');
      return;
    }
    try {
      const created = await api.createReview({
        productId: product.id,
        authorName,
        rating,
        comment,
      });
      setReviews((prev) => [created, ...prev]);
      setAuthorName('');
      setComment('');
      showToast('Thanks for sharing your review!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save review.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left: Interactive 3D Viewer */}
        <div className="lg:col-span-7">
          <div className="studio-stage-bg studio-card featured-glow-border relative h-[380px] overflow-hidden rounded-3xl border border-black/10 sm:h-[520px] dark:border-white/10">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm">
                  {t.studio.getting3DReady}
                </div>
              }
            >
              <Product3DViewer
                productType={product.productType}
                colorHex={activeColor.hex}
                autoSpin={autoSpin}
                lightingMood={lightingMood}
                onCameraPreset={cameraPreset}
                fallbackImageUrl={product.imageUrl}
              />
            </Suspense>

            {/* Studio Camera & Light Controls with shared-layout sliding pill */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-2xl border border-black/10 bg-white/92 p-1.5 shadow-lg backdrop-blur-md dark:border-white/15 dark:bg-[#16161D]/92">
              {(['front', 'side', 'back'] as const).map((view) => {
                const active = cameraPreset === view && !autoSpin;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => {
                      setAutoSpin(false);
                      setCameraPreset(view);
                    }}
                    className={`relative min-h-[36px] rounded-xl px-3.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'text-white'
                        : 'text-zinc-700 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={motionEnabled ? 'pdp-view-pill' : undefined}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl bg-[#7C3AED]"
                      />
                    )}
                    <span className="relative z-10">{view}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setAutoSpin((s) => !s)}
                className={`relative inline-flex min-h-[36px] items-center gap-1 rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  autoSpin
                    ? 'text-white'
                    : 'text-zinc-700 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                {autoSpin && (
                  <motion.span
                    layoutId={motionEnabled ? 'pdp-view-pill' : undefined}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF5A5F]"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1">
                  <RotateCw
                    className={`h-3.5 w-3.5 ${autoSpin && motionEnabled ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '4s' }}
                  />
                  360°
                </span>
              </button>
              <select
                value={lightingMood}
                onChange={(e) => setLightingMood(e.target.value as LightingMood)}
                aria-label="Studio lighting mood"
                className="min-h-[36px] rounded-xl bg-transparent px-2 text-xs font-semibold dark:bg-[#16161D]"
              >
                <option value="daylight">Daylight</option>
                <option value="violet">Violet Light</option>
                <option value="sunset">Sunset Light</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Drag with your finger or mouse to turn the 3D model. Double-click to zoom in.
          </p>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5">
          <div className="studio-card rounded-3xl border border-black/10 bg-white/95 p-6 backdrop-blur-sm sm:p-8 dark:border-white/10 dark:bg-[#16161D]/95">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span>{product.material}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              {product.shortDescription}
            </p>

            <div className="mt-5 flex flex-wrap items-baseline gap-2.5">
              <AnimatedNumber
                value={product.basePrice * quantity}
                prefix="Rs "
                className="font-display text-3xl font-extrabold"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.shopping.taxIncludedFull}
              </span>
              <HelpTooltip
                label="About tax and return policy"
                text="18% GST is already included in this price. Free delivery on orders Rs 599+. Damaged or misprinted items are replaced free within 7 days."
              />
            </div>

            <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {product.stock > 10
                ? `In stock (${product.stock} ready to print)`
                : `Only ${product.stock} left — ships in 24 hours`}
            </p>

            {/* Automatic Bundle Offer callout for T-Shirts and Mugs */}
            {isBundleEligible && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/8 px-3.5 py-2.5 text-xs font-semibold text-[#6D28D9] dark:border-[#7C3AED]/30 dark:bg-[#7C3AED]/15 dark:text-[#C4B5FD]">
                <Percent className="h-4 w-4 shrink-0" />
                <span>{t.shopping.bundleBanner}</span>
              </div>
            )}

            {/* Color selector */}
            <div className="mt-6">
              <div className="text-sm font-semibold">
                {t.studio.sizeAndColor}: {activeColor.name}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    aria-label={`Choose color ${c.name}`}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                      idx === selectedColorIdx
                        ? 'scale-110 border-[#7C3AED] ring-2 ring-[#7C3AED]/40'
                        : 'border-black/20 dark:border-white/25'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {idx === selectedColorIdx && (
                      <Check
                        className={`h-4 w-4 ${
                          ['#FFFFFF', '#F5F3EE', '#E8DFD1', '#E5DEC9'].includes(c.hex)
                            ? 'text-black'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector + Size & Fit Guide trigger */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">Pick your size</span>
                {product.productType !== 'mug' && (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] underline-offset-4 hover:underline dark:text-[#A78BFA]"
                  >
                    <Ruler className="h-3.5 w-3.5" />
                    {t.shopping.sizeGuide}
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`relative min-h-[44px] min-w-[52px] rounded-xl border px-4 text-sm font-semibold transition-colors ${
                        active
                          ? 'border-transparent text-white'
                          : 'border-black/15 hover:border-[#7C3AED] dark:border-white/15'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId={motionEnabled ? 'pdp-size-pill' : undefined}
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl bg-[#7C3AED]"
                        />
                      )}
                      <span className="relative z-10">{size}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="inline-flex items-center rounded-xl border border-black/15 dark:border-white/15">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-11 w-11 items-center justify-center transition active:scale-90"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="flex h-11 w-11 items-center justify-center transition active:scale-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Primary Actions: Buy Now, Design in 3D, Add to Cart, Compare & Wishlist */}
            <div className="mt-7 flex flex-col gap-2.5">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <motion.button
                  type="button"
                  whileHover={motionEnabled ? { y: -1 } : undefined}
                  whileTap={motionEnabled ? { scale: 0.97 } : undefined}
                  onClick={handleBuyNow}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5A5F] px-5 text-base font-semibold text-white shadow-lg shadow-[#FF5A5F]/25 transition hover:bg-[#e54b50]"
                >
                  <Zap className="h-5 w-5" />
                  {t.shopping.buyNow}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={motionEnabled ? { y: -1 } : undefined}
                  whileTap={motionEnabled ? { scale: 0.97 } : undefined}
                  onClick={handleAdd}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border border-black/15 bg-zinc-900 px-5 text-base font-semibold text-white transition hover:bg-zinc-800 dark:border-white/15 dark:bg-white dark:text-[#111116] dark:hover:bg-zinc-200"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {t.common.addToCart}
                </motion.button>
              </div>

              <div className="flex gap-2.5">
                <MagneticWrapper className="flex-1" strength={0.08}>
                  <Link
                    to={`/studio?product=${product.productType}&id=${product.id}&color=${encodeURIComponent(activeColor.hex)}`}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition hover:-translate-y-0.5 hover:bg-[#6D28D9] sm:text-base"
                  >
                    <Palette className="h-5 w-5" />
                    Add Your Own Design in 3D
                  </Link>
                </MagneticWrapper>

                <button
                  type="button"
                  aria-pressed={isComparing}
                  onClick={() => toggleCompare(product.id)}
                  title={isComparing ? t.shopping.comparing : t.shopping.compare}
                  aria-label={isComparing ? `Remove ${product.name} from compare` : `Compare ${product.name}`}
                  className={`flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-2xl border px-3.5 text-xs font-semibold transition ${
                    isComparing
                      ? 'border-[#7C3AED] bg-[#7C3AED]/12 text-[#7C3AED] dark:border-[#A78BFA] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]'
                      : 'border-black/15 bg-white hover:border-[#7C3AED] dark:border-white/15 dark:bg-[#14141B]'
                  }`}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isComparing ? t.shopping.comparing : t.shopping.compare}
                  </span>
                </button>

                <WishlistBurstButton
                  saved={isSaved}
                  onToggle={() => toggleWishlist(product.id)}
                  ariaLabel="Save to wishlist"
                  className="h-12 w-12 shrink-0 rounded-2xl border border-black/15 bg-white dark:border-white/15 dark:bg-[#14141B]"
                  iconClassName="h-5 w-5"
                />
              </div>
            </div>

            {/* Pincode Delivery Date Estimator */}
            <PincodeEstimator />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>
          <div className="mt-5 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-zinc-500">No reviews yet. Be the first to review this item!</p>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{rev.authorName}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-1 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <form
            onSubmit={handleReviewSubmit}
            className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]"
          >
            <h3 className="font-display text-lg font-bold">Write a Review</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="rev-name" className="block text-sm font-medium">
                  Your Name
                </label>
                <input
                  id="rev-name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Meera"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15"
                />
              </div>
              <div>
                <label htmlFor="rev-rating" className="block text-sm font-medium">
                  Star Rating
                </label>
                <select
                  id="rev-rating"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15 dark:bg-[#16161D]"
                >
                  <option value={5}>5 Stars — Loved it</option>
                  <option value={4}>4 Stars — Really good</option>
                  <option value={3}>3 Stars — Okay</option>
                  <option value={2}>2 Stars — Could be better</option>
                  <option value={1}>1 Star — Not happy</option>
                </select>
              </div>
              <div>
                <label htmlFor="rev-comment" className="block text-sm font-medium">
                  Your Thoughts
                </label>
                <textarea
                  id="rev-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others how the fabric and print felt..."
                  className="mt-1 w-full rounded-xl border border-black/15 bg-transparent p-3 text-base dark:border-white/15"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] w-full rounded-xl bg-[#7C3AED] font-semibold text-white hover:bg-[#6D28D9]"
              >
                Post Review
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Recently Viewed Strip */}
      <RecentlyViewedStrip products={products} excludeId={product.id} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">You may also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Size & Fit Guide Modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        defaultTab={product.productType}
      />
    </div>
  );
};
