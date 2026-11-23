import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Star, Sparkles, Check, Zap, ArrowLeftRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { WishlistBurstButton, useMotionEnabled } from './MotionPrimitives.tsx';
import type { Product } from '../types/index.ts';

interface ProductCardProps {
  product: Product;
}

const NEW_DROP_IDS = new Set(['prod-21', 'prod-22', 'prod-23', 'prod-24']);

function getMerchandisingTag(product: Product): {
  label: string;
  tone: 'violet' | 'coral' | 'dark';
  compareAtPrice?: number;
} | null {
  if (NEW_DROP_IDS.has(product.id)) {
    return { label: 'New Drop', tone: 'violet' };
  }
  if (product.trending && product.reviewCount >= 80) {
    return { label: 'Bestseller', tone: 'dark' };
  }
  if (product.basePrice >= 799) {
    const compareAt = Math.round((product.basePrice * 1.18) / 10) * 10 - 1;
    return { label: 'Save 15%', tone: 'coral', compareAtPrice: compareAt };
  }
  return null;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const t = useT();
  const navigate = useNavigate();
  const motionEnabled = useMotionEnabled();
  const wishlist = useAppStore((s) => s.wishlist);
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const addToCart = useAppStore((s) => s.addToCart);
  const [imgError, setImgError] = React.useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = React.useState(0);
  const [justAdded, setJustAdded] = React.useState(false);
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  const isSaved = wishlist.includes(product.id);
  const isComparing = compareIds.includes(product.id);

  const selectedColor = product.colors[selectedColorIdx] ||
    product.colors[0] || { name: 'Charcoal Black', hex: '#18181B' };
  const merchTag = React.useMemo(() => getMerchandisingTag(product), [product]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!motionEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: -(ny - 0.5) * 6.5,
      ry: (nx - 0.5) * 6.5,
      gx: nx * 100,
      gy: ny * 100,
      active: true,
    });
  };

  const buildCartPayload = () => ({
    id: `cart-${product.id}-${selectedColor.name}-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    productType: product.productType,
    imageUrl: product.imageUrl,
    colorName: selectedColor.name,
    colorHex: selectedColor.hex,
    size: product.sizes[0] || 'M',
    printArea: (product.productType === 'mug' ? 'wrap' : 'front') as 'wrap' | 'front',
    quantity: 1,
    unitPrice: product.basePrice,
  });

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
    addToCart(buildCartPayload(), {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(buildCartPayload(), undefined, { openDrawer: false, silentToast: true });
    navigate('/checkout');
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false })}
      style={{
        transform: !motionEnabled
          ? undefined
          : `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(${tilt.active ? -5 : 0}px)`,
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
      className="studio-card card-glow-hover group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-black/8 bg-white/95 backdrop-blur-sm transition-shadow duration-200 hover:shadow-xl hover:shadow-[#7C3AED]/10 dark:border-white/10 dark:bg-[#14141B]/95 dark:hover:shadow-black/50"
    >
      {/* Dynamic cursor specular sheen */}
      {motionEnabled && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
          style={{
            opacity: tilt.active ? 1 : 0,
            background: `radial-gradient(380px circle at ${tilt.gx}% ${tilt.gy}%, rgba(124, 58, 237, 0.13), rgba(255, 90, 95, 0.06) 45%, transparent 72%)`,
          }}
        />
      )}

      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-[#1B1B24]"
      >
        {!imgError ? (
          <img
            src={product.imageUrl}
            alt={`${product.name} — ${product.material}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07] group-hover:-rotate-[0.9deg]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#7C3AED]/15 to-[#FF5A5F]/15 p-6 text-center">
            <Sparkles className="h-8 w-8 text-[#7C3AED]" />
            <span className="mt-2 text-sm font-medium">{product.name}</span>
          </div>
        )}

        {/* Measured subtle hover scrim for crisp overlay legibility */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Single clean merchandising badge (max 1 per card) */}
        {merchTag && (
          <span
            className={`absolute top-3 left-3 z-20 rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide shadow-sm backdrop-blur-md ${
              merchTag.tone === 'violet'
                ? 'bg-[#7C3AED]/92 text-white'
                : merchTag.tone === 'coral'
                  ? 'bg-[#FF5A5F]/92 text-white'
                  : 'bg-[#111116]/82 text-white dark:bg-white/90 dark:text-[#111116]'
            }`}
          >
            {merchTag.label}
          </span>
        )}

        {/* Selected swatch quick preview chip revealed softly on hover */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-black/62 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-md transition-all duration-200 group-hover:opacity-100">
          <span
            className="h-2.5 w-2.5 rounded-full border border-white/60"
            style={{ backgroundColor: selectedColor.hex }}
          />
          <span>{selectedColor.name}</span>
        </div>

        {/* Playful burst/pop Wishlist Heart */}
        <WishlistBurstButton
          saved={isSaved}
          onToggle={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          ariaLabel={isSaved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          className="absolute top-3 right-3 z-20 h-10 w-10 rounded-full border border-black/5 bg-white/92 text-[#111116] shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[#0E0E12]/88 dark:text-[#F5F5F7]"
        />
      </Link>

      <div className="relative z-10 flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="truncate font-medium">
            {product.category} · {product.material}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {product.rating}
          </span>
        </div>

        <Link to={`/product/${product.slug}`} className="mt-2 block">
          <h3 className="font-display text-[17px] font-bold leading-snug tracking-tight text-[#111116] transition-colors group-hover:text-[#7C3AED] dark:text-[#F5F5F7] dark:group-hover:text-[#A78BFA]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {product.shortDescription}
        </p>

        {/* Interactive color selector right on card */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label={`Choose color for ${product.name}`}>
            {product.colors.slice(0, 5).map((c, idx) => {
              const active = idx === selectedColorIdx;
              const lightSwatch =
                c.hex.toLowerCase() === '#ffffff' ||
                c.hex.toLowerCase() === '#f5f3ee' ||
                c.hex.toLowerCase() === '#e5dec9' ||
                c.hex.toLowerCase() === '#d6c7b2';
              return (
                <motion.button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={c.name}
                  whileHover={motionEnabled ? { scale: 1.18 } : undefined}
                  whileTap={motionEnabled ? { scale: 0.9 } : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColorIdx(idx);
                  }}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-shadow ${
                    active
                      ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/35'
                      : 'border-black/20 dark:border-white/25'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {active && (
                    <Check className={`h-3 w-3 ${lightSwatch ? 'text-black' : 'text-white'}`} />
                  )}
                </motion.button>
              );
            })}
          </div>
          <span className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {selectedColor.name}
          </span>
        </div>

        {/* Price + Compare toggle */}
        <div className="mt-auto border-t border-black/6 pt-4 mt-5 dark:border-white/8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-lg font-extrabold tabular-nums text-[#111116] dark:text-[#F5F5F7]">
                  Rs {product.basePrice}
                </span>
                {merchTag?.compareAtPrice && (
                  <span className="text-xs text-zinc-400 line-through tabular-nums dark:text-zinc-500">
                    Rs {merchTag.compareAtPrice}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t.shopping.taxIncluded}
              </div>
            </div>

            <button
              type="button"
              aria-pressed={isComparing}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCompare(product.id);
              }}
              className={`inline-flex min-h-[34px] items-center gap-1 rounded-xl border px-2.5 text-[11px] font-semibold transition whitespace-nowrap shrink-0 ${
                isComparing
                  ? 'border-[#7C3AED] bg-[#7C3AED]/12 text-[#7C3AED] dark:border-[#A78BFA] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]'
                  : 'border-black/12 text-zinc-600 hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-white/15 dark:text-zinc-300 dark:hover:border-[#A78BFA]'
              }`}
            >
              <ArrowLeftRight className="h-3 w-3" />
              {isComparing ? t.shopping.comparing : t.shopping.compare}
            </button>
          </div>

          {/* Clear 3-action row: Design, Add to Cart, Buy Now */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Link
              to={`/studio?product=${product.productType}&id=${product.id}&color=${encodeURIComponent(selectedColor.hex)}`}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-black/15 px-2 text-xs font-semibold text-[#111116] transition hover:border-[#7C3AED] hover:text-[#7C3AED] active:scale-95 dark:border-white/15 dark:text-[#F5F5F7] dark:hover:border-[#A78BFA] whitespace-nowrap"
            >
              {t.shopping.design}
            </Link>

            <motion.button
              type="button"
              whileHover={motionEnabled ? { y: -1 } : undefined}
              whileTap={motionEnabled ? { scale: 0.94 } : undefined}
              onClick={handleQuickAdd}
              className={`inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-white shadow-sm transition-colors whitespace-nowrap ${
                justAdded
                  ? 'bg-emerald-600 shadow-emerald-600/25'
                  : 'bg-[#7C3AED] shadow-[#7C3AED]/20 hover:bg-[#6D28D9]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.common.addToCart}</span>
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              whileHover={motionEnabled ? { y: -1 } : undefined}
              whileTap={motionEnabled ? { scale: 0.94 } : undefined}
              onClick={handleBuyNow}
              className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-[#FF5A5F] px-2 text-xs font-semibold text-white shadow-sm shadow-[#FF5A5F]/20 transition hover:bg-[#e54b50] whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t.shopping.buyNow}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
