import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Palette,
  Eye,
  Truck,
  Shirt,
  Star,
  Scissors,
  Layers,
  Sparkles,
  Copy,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { useT } from '../hooks/useT.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { ProductCardSkeleton } from '../components/Skeleton.tsx';
import { HelpTooltip } from '../components/HelpTooltip.tsx';
import { MagneticWrapper, useMotionEnabled } from '../components/MotionPrimitives.tsx';
import type { Banner, Category, Product, Review } from '../types/index.ts';

gsap.registerPlugin(ScrollTrigger);

const Product3DViewer = lazy(() =>
  import('../components/three/Product3DViewer.tsx').then((m) => ({ default: m.Product3DViewer }))
);

const HERO_SWATCHES = [
  { name: 'Charcoal Black', hex: '#18181B' },
  { name: 'Electric Violet', hex: '#7C3AED' },
  { name: 'Coral Red', hex: '#FF5A5F' },
  { name: 'Royal Cobalt', hex: '#2563EB' },
  { name: 'Warm Ivory', hex: '#F5F3EE' },
  { name: 'Sage Earth', hex: '#6B7F6E' },
];

const MARQUEE_ITEMS = [
  '240 GSM COMBED COTTON',
  '300 DPI BREATHABLE DTG PRINT',
  'AAA GLAZED CERAMIC MUGS',
  '360° LIVE STUDIO PREVIEW',
  'TWIN-NEEDLE COVERSTITCHING',
  '28+ CURATED CUSTOM BLANKS',
  'FREE DELIVERY ON RS 599+',
  '18% GST INCLUDED IN PRICE',
];

const CRAFT_PILLARS = [
  {
    num: '01',
    icon: Scissors,
    title: 'Tailored Heavyweight Finishing',
    subtitle: '240 GSM Combed Cotton',
    description:
      'Built with a 1×1 ribbed crew-neck collar that never sags, twin-needle coverstitched cuffs and hem, and soft interior cotton back-neck taping.',
  },
  {
    num: '02',
    icon: Layers,
    title: 'Breathable 300 DPI Print',
    subtitle: 'Water-Based DTG Ink',
    description:
      'Ink bonds directly into the cotton weave instead of sitting like stiff plastic vinyl—keeping colors sharp, soft to touch, and wash-proof.',
  },
  {
    num: '03',
    icon: Sparkles,
    title: 'AAA Glazed Ceramic Mugs',
    subtitle: 'Microwave & Dishwasher Safe',
    description:
      'Thick rounded drinking lip, sculpted ergonomic C-handle, and seamless full-wrap sublimation printing with a mirror-smooth clearcoat glaze.',
  },
];

const CATEGORY_STARTING_PRICE: Record<string, string> = {
  tshirts: 'From Rs 499',
  mugs: 'From Rs 349',
  hoodies: 'From Rs 1,299',
  caps: 'From Rs 429',
};

const AnimatedCount: React.FC<{ target: number; suffix?: string; disabled?: boolean }> = ({
  target,
  suffix = '',
  disabled = false,
}) => {
  const [val, setVal] = useState(disabled ? target : 0);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (disabled || reduced) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, disabled]);

  return (
    <>
      {val}
      {suffix}
    </>
  );
};

export const HomePage: React.FC = () => {
  const t = useT();
  const liteMode = useAppStore((s) => s.liteMode);
  const motionEnabled = useMotionEnabled();
  const showToast = useAppStore((s) => s.showToast);
  const setAppliedCouponCode = useAppStore((s) => s.setAppliedCouponCode);
  const setCartDrawerOpen = useAppStore((s) => s.setCartDrawerOpen);
  const cartCount = useAppStore((s) => s.cart.length);

  const [heroColor, setHeroColor] = useState(HERO_SWATCHES[0]);
  const [heroStageMode, setHeroStageMode] = useState<'both' | 'tshirt' | 'mug'>('both');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyStep, setStoryStep] = useState(0);
  const [storyRotation, setStoryRotation] = useState(0);
  const [storyPreviewMode, setStoryPreviewMode] = useState<'auto' | 'tshirt' | 'mug' | 'both'>('both');
  const [storyAutoSpin, setStoryAutoSpin] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterErr, setNewsletterErr] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const storySectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.getProducts(), api.getCategories(), api.getReviews(), api.getBanners()])
      .then(([prods, cats, revs, bans]) => {
        if (!active) return;
        setProducts(prods);
        setCategories(cats);
        setReviews(revs);
        setBanner(bans.find((b) => b.active) || null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (liteMode || reduced || !storySectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: storySectionRef.current,
        start: 'top 70%',
        end: 'bottom 40%',
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          setStoryRotation(p * Math.PI * 2);
          setStoryStep(Math.min(3, Math.floor(p * 4)));
        },
      });
    }, storySectionRef);

    return () => ctx.revert();
  }, [liteMode]);

  const titleWords = t.hero.title.split(' ');
  // Showcase the newest studio arrivals + top flagships (8 trending items)
  const trendingProducts = [...products.filter((p) => p.trending)].reverse().slice(0, 8);

  const storySteps = [
    {
      num: '01',
      icon: Shirt,
      title: t.howItWorks.step1Title,
      desc: t.howItWorks.step1Desc,
      color: '#18181B',
    },
    {
      num: '02',
      icon: Palette,
      title: t.howItWorks.step2Title,
      desc: t.howItWorks.step2Desc,
      color: '#7C3AED',
    },
    {
      num: '03',
      icon: Eye,
      title: t.howItWorks.step3Title,
      desc: t.howItWorks.step3Desc,
      color: '#FF5A5F',
    },
    {
      num: '04',
      icon: Truck,
      title: t.howItWorks.step4Title,
      desc: t.howItWorks.step4Desc,
      color: '#2563EB',
    },
  ];

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterErr('');
    const clean = newsletterEmail.trim();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setNewsletterErr('Please enter a valid email address (for example: name@gmail.com).');
      return;
    }
    setNewsletterBusy(true);
    try {
      await api.subscribeWelcomePerk(clean);
      setSubscribed(true);
      setNewsletterEmail('');
      showToast('Code WELCOME10 unlocked! Copy it or tap Apply to Cart.', 'success');
    } catch (err) {
      setNewsletterErr(err instanceof Error ? err.message : 'Please check your email and try again.');
    } finally {
      setNewsletterBusy(false);
    }
  };

  const handleCopyWelcomeCode = async () => {
    try {
      await navigator.clipboard.writeText('WELCOME10');
      setCodeCopied(true);
      showToast('Copied WELCOME10 to clipboard!', 'success');
      setTimeout(() => setCodeCopied(false), 2200);
    } catch {
      showToast('Code is WELCOME10 — enter it in your cart.', 'info');
    }
  };

  const handleApplyWelcomeToCart = () => {
    setAppliedCouponCode('WELCOME10');
    showToast('WELCOME10 saved to your cart & checkout! (10% off orders Rs 499+)', 'success');
    if (cartCount > 0) {
      setCartDrawerOpen(true);
    }
  };

  return (
    <div className="relative overflow-x-clip">
      {/* Slim Editorial Offer Strip */}
      {banner && (
        <div className="border-b border-black/8 bg-gradient-to-r from-[#7C3AED]/10 via-[#7C3AED]/6 to-[#FF5A5F]/10 px-4 py-2.5 text-center text-xs font-medium sm:text-sm dark:border-white/8">
          <span className="text-zinc-700 dark:text-zinc-200">{banner.title}</span>
          <Link
            to={banner.ctaLink}
            className="ml-2.5 inline-flex items-center gap-0.5 font-semibold text-[#7C3AED] underline underline-offset-4 transition hover:text-[#6D28D9] dark:text-[#A78BFA]"
          >
            {banner.ctaLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Drifting Ambient Architectural Aurora */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] rounded-full opacity-22 blur-3xl dark:opacity-28 ${
            !motionEnabled ? '-translate-x-1/2' : 'animate-aurora'
          }`}
          style={{
            background:
              'radial-gradient(circle at 28% 38%, #7C3AED 0%, #EC4899 42%, #FF5A5F 62%, transparent 78%)',
          }}
        />
        {/* Ambient floating studio accents */}
        {motionEnabled && (
          <>
            <div
              aria-hidden="true"
              className="animate-float-slow pointer-events-none absolute top-28 right-[6%] h-44 w-44 rounded-full bg-[#7C3AED]/16 blur-3xl dark:bg-[#7C3AED]/22"
            />
            <div
              aria-hidden="true"
              className="animate-float-reverse pointer-events-none absolute bottom-10 left-[4%] h-40 w-40 rounded-full bg-[#FF5A5F]/14 blur-3xl dark:bg-[#FF5A5F]/20"
            />
          </>
        )}

        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pt-16 lg:pb-24">
          <div className="lg:col-span-6">
            <motion.p
              initial={liteMode ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA]"
            >
              {t.hero.kicker}
            </motion.p>

            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.035em] leading-[1.06] sm:text-5xl lg:text-[3.65rem]">
              {titleWords.map((word, idx) => {
                const isAccent = idx >= titleWords.length - 2;
                return (
                  <motion.span
                    key={`${word}-${idx}`}
                    initial={liteMode ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: liteMode ? 0 : idx * 0.045,
                      type: 'spring',
                      stiffness: 260,
                      damping: 22,
                    }}
                    className={`mr-2.5 inline-block ${
                      isAccent
                        ? 'bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#FF5A5F] bg-clip-text text-transparent'
                        : ''
                    }`}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </h1>

            <motion.p
              initial={liteMode ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: liteMode ? 0 : 0.22, duration: 0.4 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-300"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* Color Swatches */}
            <motion.div
              initial={liteMode ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: liteMode ? 0 : 0.3, duration: 0.4 }}
              className="mt-7"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span>{t.hero.colorLabel}</span>
                <span aria-hidden="true">·</span>
                <strong className="normal-case tracking-normal text-sm text-[#111116] dark:text-[#F5F5F7]">
                  {heroColor.name}
                </strong>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {HERO_SWATCHES.map((swatch) => {
                  const selected = swatch.hex === heroColor.hex;
                  return (
                    <motion.button
                      key={swatch.name}
                      type="button"
                      whileHover={liteMode ? undefined : { scale: 1.12, y: -2 }}
                      whileTap={liteMode ? undefined : { scale: 0.94 }}
                      onClick={() => setHeroColor(swatch)}
                      aria-label={`Try ${swatch.name} color`}
                      aria-pressed={selected}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                        selected
                          ? 'border-[#7C3AED] ring-4 ring-[#7C3AED]/20'
                          : 'border-black/15 dark:border-white/25'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {selected && (
                        <Check
                          className={`h-4 w-4 ${
                            swatch.hex === '#F5F3EE' ? 'text-black' : 'text-white'
                          }`}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Primary & Secondary CTAs */}
            <motion.div
              initial={liteMode ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: liteMode ? 0 : 0.38, duration: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-3.5"
            >
              <MagneticWrapper>
                <Link
                  to="/studio?product=tshirt"
                  className={`inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-[#7C3AED] px-7 text-base font-semibold text-white shadow-lg shadow-[#7C3AED]/25 transition hover:-translate-y-0.5 hover:bg-[#6D28D9] active:translate-y-0 active:scale-[0.98] ${
                    !motionEnabled ? '' : 'animate-cta-pulse'
                  }`}
                >
                  {t.hero.primaryCta}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </MagneticWrapper>
              <MagneticWrapper strength={0.1}>
                <Link
                  to="/shop"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-black/15 bg-white/80 px-6 text-base font-semibold backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:border-white/30 dark:hover:bg-white/10"
                >
                  {t.hero.secondaryCta}
                </Link>
              </MagneticWrapper>
            </motion.div>

            {/* Clean Typographic Studio Specs Strip with Count-Up */}
            <motion.div
              initial={liteMode ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: liteMode ? 0 : 0.46, duration: 0.45 }}
              className="mt-8 grid grid-cols-3 gap-4 border-t border-black/8 pt-6 dark:border-white/10"
            >
              <div>
                <div className="font-display text-lg font-extrabold tabular-nums text-[#111116] dark:text-[#F5F5F7]">
                  <AnimatedCount target={240} suffix=" GSM" disabled={liteMode} />
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Combed Cotton</div>
              </div>
              <div className="border-l border-black/8 pl-4 dark:border-white/10">
                <div className="font-display text-lg font-extrabold tabular-nums text-[#111116] dark:text-[#F5F5F7]">
                  <AnimatedCount target={300} suffix=" DPI" disabled={liteMode} />
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">DTG & Ceramic Print</div>
              </div>
              <div className="border-l border-black/8 pl-4 dark:border-white/10">
                <div className="flex items-center gap-1 font-display text-lg font-extrabold tabular-nums text-[#111116] dark:text-[#F5F5F7]">
                  4.9 <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Tax Included</span>
                  <HelpTooltip
                    label="About tax and delivery"
                    text="Every price shown includes 18% GST tax. Standard delivery is free on orders Rs 599 and above."
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3D Interactive Studio Stage */}
          <motion.div
            initial={liteMode ? false : { opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <div
              data-cursor="3d"
              className="studio-stage-bg studio-card featured-glow-border relative h-[400px] w-full overflow-hidden rounded-[28px] border border-black/10 sm:h-[500px] dark:border-white/12"
            >
              {/* Minimal Top-Left Studio Specification Label */}
              <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-black/8 bg-white/90 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-zinc-700 backdrop-blur-md dark:border-white/10 dark:bg-[#14141B]/90 dark:text-zinc-200">
                <span>LIVE 360° STUDIO</span>
                <span aria-hidden="true" className="opacity-40">|</span>
                <span className="font-mono text-[#7C3AED] dark:text-[#A78BFA]">{heroColor.name}</span>
              </div>

              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    {t.studio.getting3DReady}
                  </div>
                }
              >
                <Product3DViewer
                  productType={heroStageMode === 'mug' ? 'mug' : 'tshirt'}
                  colorHex={heroStageMode === 'mug' ? '#FAF9F6' : heroColor.hex}
                  showDualHero={heroStageMode === 'both'}
                  autoSpin
                  interactive
                  fallbackImageUrl="/src/assets/images/product_tshirt_charcoal_1794922912702.jpg"
                />
              </Suspense>

              {/* Compact Bottom Studio Stage Controls with shared-layout sliding pill */}
              <div className="absolute right-4 bottom-4 left-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-white/92 px-2.5 py-2 text-xs font-semibold shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#14141B]/92">
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'both', label: 'T-Shirt + Mug' },
                      { id: 'tshirt', label: 'T-Shirt Close-Up' },
                      { id: 'mug', label: 'Ceramic Mug' },
                    ] as const
                  ).map((mode) => {
                    const active = heroStageMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setHeroStageMode(mode.id)}
                        className={`relative min-h-[34px] rounded-xl px-3 transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'text-white'
                            : 'text-zinc-600 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId={motionEnabled ? 'hero-stage-pill' : undefined}
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-xl bg-[#111116] dark:bg-[#7C3AED]"
                          />
                        )}
                        <span className="relative z-10">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="hidden pr-1.5 text-[11px] font-medium text-zinc-500 sm:inline dark:text-zinc-400">
                  Drag to rotate 360°
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Kinetic Studio Craft Marquee Ribbon */}
      <div
        aria-label="DesignDrop craft highlights"
        className="overflow-hidden border-y border-black/8 bg-white/70 py-3.5 dark:border-white/8 dark:bg-[#121218]"
      >
        <div className={liteMode ? 'flex flex-wrap justify-center gap-6 px-4' : 'animate-marquee'}>
          {(liteMode ? MARQUEE_ITEMS.slice(0, 5) : [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]).map(
            (item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="flex shrink-0 items-center gap-5 px-4 font-mono text-[11px] font-semibold tracking-[0.16em] text-zinc-600 dark:text-zinc-300"
              >
                <span>{item}</span>
                <span aria-hidden="true" className="text-[#7C3AED] dark:text-[#A78BFA]">
                  ✦
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Scroll Storytelling: How It Works in 4 Simple Steps */}
      <section ref={storySectionRef} className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:py-20">
        <motion.div
          initial={liteMode ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl"
        >
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA]">
            HOW IT WORKS
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">
            {t.howItWorks.heading}
          </h2>
          <p className="mt-2.5 text-base text-zinc-600 dark:text-zinc-400">
            {t.howItWorks.subheading}
          </p>
        </motion.div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {storySteps.map((step, index) => {
              const Icon = step.icon;
              const active = storyStep === index;
              return (
                <motion.button
                  key={step.title}
                  type="button"
                  initial={liteMode ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: liteMode ? 0 : index * 0.08, duration: 0.4 }}
                  whileHover={liteMode ? undefined : { y: -4 }}
                  whileTap={liteMode ? undefined : { scale: 0.985 }}
                  onClick={() => {
                    setStoryStep(index);
                    setStoryRotation(index * (Math.PI / 2));
                  }}
                  className={`studio-card flex flex-col items-start rounded-2xl border p-6 text-left transition-colors duration-200 ${
                    active
                      ? 'border-[#7C3AED] bg-[#7C3AED]/8 dark:bg-[#7C3AED]/14'
                      : 'border-black/8 bg-white hover:border-[#7C3AED]/45 dark:border-white/10 dark:bg-[#14141B]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED]/12 text-[#7C3AED] dark:text-[#A78BFA]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.desc}
                  </p>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            initial={liteMode ? false : { opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div
              data-cursor="3d"
              className="studio-stage-bg studio-card relative h-[380px] w-full overflow-hidden rounded-[28px] border border-black/10 sm:h-[430px] dark:border-white/12"
            >
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm">
                    {t.studio.getting3DReady}
                  </div>
                }
              >
                <Product3DViewer
                  productType={
                    storyPreviewMode === 'mug'
                      ? 'mug'
                      : storyPreviewMode === 'tshirt'
                        ? 'tshirt'
                        : storyStep === 2
                          ? 'mug'
                          : 'tshirt'
                  }
                  showDualHero={storyPreviewMode === 'both'}
                  colorHex={
                    storyPreviewMode === 'mug'
                      ? '#FAF9F6'
                      : storySteps[storyStep]?.color || '#18181B'
                  }
                  externalRotationY={storyAutoSpin ? undefined : storyRotation}
                  autoSpin={storyAutoSpin}
                  interactive
                  fallbackImageUrl="/src/assets/images/product_tshirt_ivory_1794922911236.jpg"
                />
              </Suspense>

              {/* Compact Bottom 3D View Switcher with shared-layout sliding pill */}
              <div className="absolute right-3 bottom-3 left-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-white/92 px-2.5 py-2 text-xs font-semibold shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#14141B]/92">
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'both', label: 'Both' },
                      { id: 'tshirt', label: 'T-Shirt' },
                      { id: 'mug', label: 'Cup / Mug' },
                    ] as const
                  ).map((item) => {
                    const active = storyPreviewMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStoryPreviewMode(item.id)}
                        className={`relative min-h-[34px] rounded-xl px-3 transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'text-white'
                            : 'text-zinc-700 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId={motionEnabled ? 'story-stage-pill' : undefined}
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-xl bg-[#7C3AED]"
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setStoryAutoSpin((v) => !v)}
                  className={`min-h-[34px] rounded-xl border px-3 transition whitespace-nowrap shrink-0 ${
                    storyAutoSpin
                      ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]'
                      : 'border-black/10 text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300'
                  }`}
                >
                  {storyAutoSpin ? '360° Spin: On' : '360° Spin: Off'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Garment Tailoring & Print Quality Craft Showcase */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <motion.div
          initial={liteMode ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.5 }}
          className="studio-card featured-glow-border overflow-hidden rounded-[28px] border border-black/8 bg-white/95 p-7 backdrop-blur-sm sm:p-10 dark:border-white/10 dark:bg-[#14141B]/95"
        >
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA]">
                GARMENT & PRINT FINISHING
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">
                Built to feel like your favorite retail tee
              </h2>
            </div>
            <Link
              to="/studio"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C3AED] transition hover:gap-2 dark:text-[#A78BFA] whitespace-nowrap"
            >
              Inspect stitching in 3D Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {CRAFT_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.num}
                  initial={liteMode ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: liteMode ? 0 : idx * 0.1, duration: 0.42 }}
                  whileHover={liteMode ? undefined : { y: -4 }}
                  className="rounded-2xl border border-black/8 bg-[#F8F8FA] p-6 transition-colors hover:border-[#7C3AED]/35 dark:border-white/8 dark:bg-[#0E0E13]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED]/12 text-[#7C3AED] dark:text-[#A78BFA]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500">
                      {pillar.num}
                    </span>
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                    {pillar.subtitle}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#111116] dark:text-[#F5F5F7]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {pillar.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Shop by Category */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA]">
              COLLECTIONS
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">
              Pick what you want to make
            </h2>
            <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
              Start with a blank item or pick a popular favorite.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA] whitespace-nowrap"
          >
            See all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={liteMode ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: liteMode ? 0 : idx * 0.08, duration: 0.42 }}
            >
              <Link
                to={`/shop?category=${cat.slug}`}
                className="studio-card card-glow-hover group block overflow-hidden rounded-[22px] border border-black/8 bg-white/95 backdrop-blur-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#7C3AED]/10 dark:border-white/10 dark:bg-[#14141B]/95 dark:hover:shadow-black/50"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-[#1C1C26]">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.07] group-hover:-rotate-[0.9deg]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent"
                  />
                  <span className="absolute top-3 left-3 rounded-lg bg-black/55 px-2.5 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md">
                    0{idx + 1}
                  </span>
                  <span className="absolute right-3 bottom-3 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#111116] shadow-sm backdrop-blur-md dark:bg-[#0E0E12]/85 dark:text-[#F5F5F7]">
                    {CATEGORY_STARTING_PRICE[cat.slug] || 'Custom printed'}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-[#111116] transition-colors group-hover:text-[#7C3AED] dark:text-[#F5F5F7] dark:group-hover:text-[#A78BFA]">
                      {cat.name}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#7C3AED]" />
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{cat.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA]">
              TRENDING STUDIO PICKS
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">
              Most loved by shoppers
            </h2>
            <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
              Pick a color right on the card, tap Design for 3D preview, or Add to Cart right away.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA] whitespace-nowrap"
          >
            Browse all {products.length || 28} items <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : trendingProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={liteMode ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ delay: liteMode ? 0 : (idx % 4) * 0.07, duration: 0.42 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </div>
      </section>

      {/* Reviews & Newsletter */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA]">
              VERIFIED BUYERS
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">
              What happy customers say
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {reviews.slice(0, 4).map((rev, idx) => (
                <motion.div
                  key={rev.id}
                  initial={liteMode ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: liteMode ? 0 : idx * 0.07, duration: 0.4 }}
                  whileHover={liteMode ? undefined : { y: -3 }}
                  className="studio-card flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-[#14141B]"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      “{rev.comment}”
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-black/6 pt-3 text-xs dark:border-white/8">
                    <span className="font-semibold text-[#111116] dark:text-[#F5F5F7]">
                      {rev.authorName}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">Verified order</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={liteMode ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.48 }}
            className="lg:col-span-5"
          >
            <div className="studio-card featured-glow-border flex h-full flex-col justify-center rounded-[28px] border border-black/10 bg-gradient-to-br from-[#7C3AED]/14 via-white to-[#FF5A5F]/14 p-8 dark:border-white/12 dark:from-[#7C3AED]/20 dark:via-[#14141B] dark:to-[#FF5A5F]/16">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA]">
                FIRST ORDER PERK
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Get 10% off your first gift
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Enter your email to unlock code <strong>WELCOME10</strong> (10% off orders Rs 499+). No spam ever.
              </p>

              {subscribed ? (
                <div className="mt-5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-4 w-4" />
                    Code unlocked! Ready for your cart & checkout.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-xl border border-dashed border-[#7C3AED] bg-white px-3.5 py-2 font-mono text-sm font-extrabold tracking-wider text-[#7C3AED] dark:bg-[#0E0E12] dark:text-[#A78BFA]">
                      WELCOME10
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWelcomeCode}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/15 bg-white px-3.5 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:bg-[#16161D] dark:hover:bg-white/10"
                    >
                      {codeCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {codeCopied ? 'Copied!' : t.enhancements.copyCode}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyWelcomeToCart}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {t.enhancements.applyToCart}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleNewsletter} className="mt-5 space-y-2.5" noValidate>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterErr) setNewsletterErr('');
                      }}
                      placeholder="yourname@email.com"
                      aria-label="Your email address"
                      className="min-h-[48px] flex-1 rounded-xl border border-black/15 bg-white px-4 text-base dark:border-white/15 dark:bg-[#0E0E12]"
                    />
                    <button
                      type="submit"
                      disabled={newsletterBusy}
                      className="min-h-[48px] rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition hover:bg-[#6D28D9] active:scale-95 disabled:opacity-60 whitespace-nowrap"
                    >
                      {newsletterBusy ? 'Sending...' : 'Unlock WELCOME10'}
                    </button>
                  </div>
                  {newsletterErr && (
                    <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                      {newsletterErr}
                    </p>
                  )}
                </form>
              )}

              {/* Clear explanation of stacking with the 10% Bundle Offer */}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#7C3AED]/20 bg-white/75 p-3 text-xs leading-relaxed text-zinc-700 dark:border-[#7C3AED]/30 dark:bg-[#0E0E12]/60 dark:text-zinc-300">
                <Percent className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7C3AED] dark:text-[#A78BFA]" />
                <span>{t.enhancements.welcomeStackNote}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
