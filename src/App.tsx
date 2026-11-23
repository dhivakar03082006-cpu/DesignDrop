import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Lenis from 'lenis';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CompareTrayAndModal } from './components/CompareTrayAndModal.tsx';
import { StatusBanners, StickyHelpButton, ToastContainer, CursorGlow } from './components/SystemOverlays.tsx';
import { FlyToCartOverlay, useMotionEnabled } from './components/MotionPrimitives.tsx';
import { detectDeviceCapabilities } from './lib/deviceDetect.ts';
import { useAppStore } from './store/useAppStore.ts';

import { HomePage } from './pages/HomePage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { DesignStudioPage } from './pages/DesignStudioPage.tsx';
import { WishlistPage } from './pages/WishlistPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { TrackOrderPage } from './pages/TrackOrderPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';
import { OfflinePage } from './pages/OfflinePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const motionEnabled = useMotionEnabled();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <>
      {/* Subtle route-change progress shimmer along top of viewport */}
      {motionEnabled && (
        <motion.div
          key={`route-bar-${location.pathname}`}
          aria-hidden="true"
          initial={{ scaleX: 0, opacity: 0.9 }}
          animate={{ scaleX: [0, 0.72, 1], opacity: [0.9, 0.9, 0] }}
          transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '0% 50%' }}
          className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-[2.5px] bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#FF5A5F]"
        />
      )}

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={motionEnabled ? { opacity: 0, y: 12, scale: 0.994 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={motionEnabled ? { opacity: 0, y: -10, scale: 0.994 } : undefined}
          transition={{
            duration: motionEnabled ? 0.26 : 0,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 flex-1"
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/studio" element={<DesignStudioPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track" element={<TrackOrderPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </>
  );
};

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const liteMode = useAppStore((s) => s.liteMode);
  const setLiteMode = useAppStore((s) => s.setLiteMode);

  // Sync theme class on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Auto-enable Lite Mode on low-end devices
  useEffect(() => {
    const caps = detectDeviceCapabilities();
    if (caps.isLowEndDevice) {
      setLiteMode(true);
    }
  }, [setLiteMode]);

  // Lenis smooth scrolling (disabled on Lite mode or reduced motion)
  useEffect(() => {
    const caps = detectDeviceCapabilities();
    if (liteMode || caps.prefersReducedMotion) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [liteMode]);

  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen-safe flex-col overflow-x-hidden bg-[#F8F8FA] text-[#111116] dark:bg-[#0E0E12] dark:text-[#F5F5F7]">
        <CursorGlow />
        <FlyToCartOverlay />
        <StatusBanners />
        <Navbar />
        <AnimatedRoutes />
        <Footer />
        <CartDrawer />
        <CompareTrayAndModal />
        <StickyHelpButton />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
