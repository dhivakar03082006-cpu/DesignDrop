import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';

/**
 * Returns true when rich animations should run (neither Lite mode nor prefers-reduced-motion).
 */
export function useMotionEnabled(): boolean {
  const liteMode = useAppStore((s) => s.liteMode);
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return !liteMode && !reduced;
}

/**
 * Smoothly animates numeric values (prices, totals, studio specs) with cubic ease-out
 * and tabular numerals. Instantly snaps in Lite mode or reduced motion.
 */
export const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}> = ({ value, prefix = '', suffix = '', durationMs = 380, className = '' }) => {
  const motionEnabled = useMotionEnabled();
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (!motionEnabled || prevRef.current === value) {
      prevRef.current = value;
      setDisplay(value);
      return;
    }

    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs, motionEnabled]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};

const BURST_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * Tactile Wishlist Heart button with a spring pop and radial burst particles on save.
 */
export const WishlistBurstButton: React.FC<{
  saved: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  className?: string;
  iconClassName?: string;
}> = ({ saved, onToggle, ariaLabel, className = '', iconClassName = 'h-4.5 w-4.5' }) => {
  const motionEnabled = useMotionEnabled();
  const [burstKey, setBurstKey] = useState(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!saved && motionEnabled) {
      setBurstKey((k) => k + 1);
    }
    onToggle(e);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={saved}
      whileHover={motionEnabled ? { scale: 1.08 } : undefined}
      whileTap={motionEnabled ? { scale: 0.88 } : undefined}
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* Expanding radial particle burst when newly saved */}
      <AnimatePresence>
        {burstKey > 0 && motionEnabled && (
          <span
            key={burstKey}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              initial={{ scale: 0.4, opacity: 0.85 }}
              animate={{ scale: 1.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="absolute h-7 w-7 rounded-full border-2 border-[#FF5A5F]"
            />
            {BURST_ANGLES.map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const tx = Math.cos(rad) * 20;
              const ty = Math.sin(rad) * 20;
              return (
                <motion.span
                  key={deg}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute h-1.5 w-1.5 rounded-full ${
                    i % 2 === 0 ? 'bg-[#FF5A5F]' : 'bg-[#7C3AED]'
                  }`}
                />
              );
            })}
          </span>
        )}
      </AnimatePresence>

      <motion.span
        key={saved ? 'saved' : 'unsaved'}
        initial={motionEnabled && saved ? { scale: 0.65 } : false}
        animate={motionEnabled && saved ? { scale: [0.65, 1.32, 0.92, 1] } : { scale: 1 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center justify-center"
      >
        <Heart
          className={`${iconClassName} transition-colors duration-200 ${
            saved ? 'fill-[#FF5A5F] text-[#FF5A5F]' : ''
          }`}
        />
      </motion.span>
    </motion.button>
  );
};

/**
 * Magnetic spring wrapper for primary studio CTAs (subtle pointer pull + tactile press).
 */
export const MagneticWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
  strength?: number;
}> = ({ children, className = '', strength = 0.16 }) => {
  const motionEnabled = useMotionEnabled();
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!motionEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    setOffset({
      x: Math.max(-8, Math.min(8, dx * strength)),
      y: Math.max(-6, Math.min(6, dy * strength)),
    });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={motionEnabled ? { x: offset.x, y: offset.y } : undefined}
      whileTap={motionEnabled ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 360, damping: 22, mass: 0.5 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Renders flying product thumbnails arcing smoothly from the clicked "Add to Cart" button
 * directly into the Navbar cart counter target.
 */
export const FlyToCartOverlay: React.FC = () => {
  const flyPackets = useAppStore((s) => s.flyPackets);
  const motionEnabled = useMotionEnabled();

  if (!motionEnabled || flyPackets.length === 0) return null;

  const targetEl =
    typeof document !== 'undefined'
      ? document.querySelector<HTMLElement>('[data-cart-target="true"]')
      : null;
  const targetRect = targetEl?.getBoundingClientRect();
  const destX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth - 72;
  const destY = targetRect ? targetRect.top + targetRect.height / 2 : 32;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <AnimatePresence>
        {flyPackets.map((pkt) => {
          const midX = (pkt.startX + destX) / 2;
          const midY = Math.min(pkt.startY, destY) - 85;
          return (
            <motion.div
              key={pkt.id}
              initial={{
                x: pkt.startX - 24,
                y: pkt.startY - 24,
                scale: 1,
                opacity: 1,
                rotate: -6,
              }}
              animate={{
                x: [pkt.startX - 24, midX - 20, destX - 14],
                y: [pkt.startY - 24, midY - 20, destY - 14],
                scale: [1, 0.85, 0.34],
                opacity: [1, 0.95, 0.15],
                rotate: [-6, 10, 22],
              }}
              exit={{ opacity: 0, scale: 0.2 }}
              transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 h-12 w-12 overflow-hidden rounded-xl border-2 border-[#7C3AED] bg-white shadow-xl shadow-[#7C3AED]/30 dark:bg-[#16161D]"
            >
              <img
                src={pkt.imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
