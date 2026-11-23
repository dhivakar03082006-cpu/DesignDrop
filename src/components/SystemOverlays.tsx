import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff, AlertTriangle, MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { useT } from '../hooks/useT.ts';
import { detectDeviceCapabilities } from '../lib/deviceDetect.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useMotionEnabled } from './MotionPrimitives.tsx';

export const StatusBanners: React.FC = () => {
  const t = useT();
  const isOnline = useOnlineStatus();
  const [dismissBrowserWarn, setDismissBrowserWarn] = useState(false);
  const caps = React.useMemo(() => detectDeviceCapabilities(), []);

  return (
    <>
      {!isOnline && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>{t.common.offlineBanner}</span>
          <Link to="/offline" className="underline ml-2">
            View offline page
          </Link>
        </div>
      )}

      {caps.isOutdatedBrowser && !dismissBrowserWarn && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 bg-zinc-900 px-4 py-2.5 text-sm text-white"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{t.common.outdatedBrowser}</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissBrowserWarn(true)}
            aria-label="Close browser message"
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
};

export const StickyHelpButton: React.FC = () => {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-18 z-30 md:bottom-5">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-black/10 bg-white p-4 shadow-2xl dark:border-white/15 dark:bg-[#16161D]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">Need a hand?</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help menu"
              className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Questions about sizing, photo quality, or delivery? Chat with our friendly team.
          </p>
          <div className="mt-3 space-y-2">
            <a
              href="https://wa.me/919000000001?text=Hi%20DesignDrop!%20I%20need%20help%20with%20my%20custom%20order."
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
            <Link
              to="/help"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-black/15 px-3 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Read Simple FAQ & Returns
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-[#111116] shadow-lg transition hover:scale-105 dark:border-white/15 dark:bg-[#1E1E28] dark:text-[#F5F5F7]"
      >
        <MessageCircle className="h-4 w-4 text-[#7C3AED]" />
        <span>{t.common.needHelp}</span>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);
  const motionEnabled = useMotionEnabled();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-20 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout={motionEnabled}
            initial={motionEnabled ? { opacity: 0, x: 28, scale: 0.94 } : false}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={motionEnabled ? { opacity: 0, x: 32, scale: 0.94 } : undefined}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md ${
              toast.type === 'error'
                ? 'border-red-500/30 bg-red-600/95 text-white'
                : toast.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-600/95 text-white'
                  : 'border-black/10 bg-white/95 text-[#111116] dark:border-white/15 dark:bg-[#1E1E28]/95 dark:text-[#F5F5F7]'
            }`}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Close message"
              className="rounded p-1 hover:bg-black/10"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const CursorGlow: React.FC = () => {
  const liteMode = useAppStore((s) => s.liteMode);
  const dotRef = React.useRef<HTMLDivElement | null>(null);
  const ringRef = React.useRef<HTMLDivElement | null>(null);
  const auraRef = React.useRef<HTMLDivElement | null>(null);
  const labelRef = React.useRef<HTMLSpanElement | null>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    if (liteMode) {
      setEnabled(false);
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setEnabled(false);
      return;
    }
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    let mouseX = -200;
    let mouseY = -200;
    let ringX = -200;
    let ringY = -200;
    let auraX = -200;
    let auraY = -200;
    let scale = 1;
    let targetScale = 1;
    let isPressed = false;
    let cursorMode: 'default' | 'action' | '3d' = 'default';
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-cursor="3d"]')) {
        cursorMode = '3d';
        targetScale = 1.85;
      } else if (target?.closest('a, button, [role="button"], input, select, textarea, label')) {
        cursorMode = 'action';
        targetScale = 1.45;
      } else {
        cursorMode = 'default';
        targetScale = 1;
      }
    };

    const onDown = () => {
      isPressed = true;
    };
    const onUp = () => {
      isPressed = false;
    };
    const onLeave = () => {
      mouseX = -200;
      mouseY = -200;
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;
      auraX += (mouseX - auraX) * 0.12;
      auraY += (mouseY - auraY) * 0.12;

      const desiredScale = isPressed ? targetScale * 0.78 : targetScale;
      scale += (desiredScale - scale) * 0.24;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${isPressed ? 0.65 : 1})`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
        ringRef.current.style.borderColor =
          cursorMode === '3d'
            ? '#FF5A5F'
            : cursorMode === 'action'
              ? '#7C3AED'
              : 'rgba(124, 58, 237, 0.55)';
        ringRef.current.style.backgroundColor =
          cursorMode === '3d'
            ? 'rgba(255, 90, 95, 0.12)'
            : cursorMode === 'action'
              ? 'rgba(124, 58, 237, 0.12)'
              : 'transparent';
      }

      if (labelRef.current) {
        labelRef.current.textContent = cursorMode === '3d' ? '3D' : '';
        labelRef.current.style.opacity = cursorMode === '3d' ? '1' : '0';
      }

      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [liteMode]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 hidden overflow-hidden md:block">
      {/* Ambient radial light aura */}
      <div
        ref={auraRef}
        className="absolute h-80 w-80 rounded-full opacity-20 blur-3xl dark:opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.5), rgba(255,90,95,0.22), transparent 70%)',
        }}
      />
      {/* Spring-damped trailing ring */}
      <div
        ref={ringRef}
        className="absolute flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-150"
      >
        <span
          ref={labelRef}
          className="font-mono text-[9px] font-bold tracking-tight text-[#FF5A5F] opacity-0 transition-opacity duration-150"
        />
      </div>
      {/* Crisp core pointer dot */}
      <div
        ref={dotRef}
        className="absolute h-2 w-2 rounded-full bg-[#7C3AED] shadow-sm shadow-[#7C3AED]"
      />
    </div>
  );
};
