import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ShoppingBag, Palette, Truck, User, Heart, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { useMotionEnabled } from './MotionPrimitives.tsx';
import { DesignDropLogo, DesignDropMark } from './DesignDropLogo.tsx';

export const BrandMark = DesignDropMark;

export const Navbar: React.FC = () => {
  const t = useT();
  const location = useLocation();
  const motionEnabled = useMotionEnabled();
  const cart = useAppStore((s) => s.cart);
  const wishlist = useAppStore((s) => s.wishlist);
  const setCartDrawerOpen = useAppStore((s) => s.setCartDrawerOpen);
  const cartBounceKey = useAppStore((s) => s.cartBounceKey);
  const wishlistPopKey = useAppStore((s) => s.wishlistPopKey);
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { to: '/', label: t.nav.home },
    { to: '/shop', label: t.nav.shop },
    { to: '/studio', label: t.nav.studio },
    { to: '/track', label: t.nav.track },
    { to: '/help', label: t.nav.help },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-black/10 glass-surface dark:border-white/10">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6">
          {/* Zone 1: Custom Ink-Drop Crest + Single-line Brand Wordmark */}
          <Link
            to="/"
            aria-label="DesignDrop Home"
            className="group inline-flex items-center whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded-xl"
          >
            <DesignDropLogo size="md" />
          </Link>

          {/* Zone 2: Clean single-line Navigation Links with shared-layout sliding pill */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative rounded-xl px-3.5 py-2 whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'font-semibold text-[#111116] dark:text-[#F5F5F7]'
                      : 'text-zinc-600 hover:text-[#111116] dark:text-zinc-400 dark:hover:text-[#F5F5F7]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={motionEnabled ? 'nav-active-pill' : undefined}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 rounded-xl bg-black/[0.055] dark:bg-white/[0.08]"
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                  {active && (
                    <motion.span
                      layoutId={motionEnabled ? 'nav-active-bar' : undefined}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      aria-hidden="true"
                      className="absolute right-3 -bottom-[15px] left-3 h-[2px] rounded-full bg-gradient-to-r from-[#7C3AED] to-[#FF5A5F]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Utility Controls & Primary Cart Action */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <motion.button
              type="button"
              whileTap={motionEnabled ? { scale: 0.9, rotate: 18 } : undefined}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-black/5 hover:text-[#111116] dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-[#F5F5F7]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4.5 w-4.5 text-amber-400" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-[#7C3AED]" />
              )}
            </motion.button>

            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishlist.length} saved)`}
              className="relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-black/5 hover:text-[#FF5A5F] dark:text-zinc-400 dark:hover:bg-white/10"
            >
              <motion.span
                key={`wl-${wishlistPopKey}`}
                animate={motionEnabled && wishlistPopKey > 0 ? { scale: [1, 1.35, 0.9, 1] } : undefined}
                transition={{ duration: 0.36 }}
                className="inline-flex"
              >
                <Heart className={`h-4.5 w-4.5 ${wishlist.length > 0 ? 'fill-[#FF5A5F] text-[#FF5A5F]' : ''}`} />
              </motion.span>
              {wishlist.length > 0 && (
                <motion.span
                  key={`wl-cnt-${wishlist.length}`}
                  initial={motionEnabled ? { scale: 0.5 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 20 }}
                  className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF5A5F] px-1 text-[10px] font-bold text-white tabular-nums"
                >
                  {wishlist.length}
                </motion.span>
              )}
            </Link>

            <Link
              to="/account"
              aria-label={t.nav.account}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-zinc-700 transition hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10 whitespace-nowrap shrink-0"
            >
              <User className="h-4.5 w-4.5" />
              <span className="hidden lg:inline">
                {user ? user.fullName.split(' ')[0] : t.nav.account}
              </span>
            </Link>

            <motion.button
              type="button"
              data-cart-target="true"
              onClick={() => setCartDrawerOpen(true)}
              aria-label={`${t.nav.cart} (${totalItems})`}
              key={`cart-btn-${cartBounceKey}`}
              animate={
                motionEnabled && cartBounceKey > 0
                  ? { scale: [1, 1.12, 0.95, 1.03, 1] }
                  : undefined
              }
              whileHover={motionEnabled ? { y: -1 } : undefined}
              whileTap={motionEnabled ? { scale: 0.95 } : undefined}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#111116] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#7C3AED] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t.nav.cart}</span>
              <motion.span
                key={`cart-count-${totalItems}`}
                initial={motionEnabled ? { scale: 0.55, opacity: 0.4 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 20 }}
                className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-white/20 px-1.5 text-xs font-bold tabular-nums"
              >
                {totalItems}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (56px compact height) with shared-layout active indicator */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-black/10 glass-surface md:hidden dark:border-white/10"
      >
        {[
          { to: '/', label: t.nav.home, icon: Home, accent: false },
          { to: '/shop', label: t.nav.shop, icon: ShoppingBag, accent: false },
          { to: '/studio', label: 'Design', icon: Palette, accent: true },
          { to: '/track', label: 'Track', icon: Truck, accent: false },
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex min-h-[44px] min-w-[54px] flex-col items-center justify-center text-[11px] font-medium ${
                active
                  ? item.accent
                    ? 'font-semibold text-[#FF5A5F]'
                    : 'font-semibold text-[#7C3AED] dark:text-[#A78BFA]'
                  : item.accent
                    ? 'font-semibold text-[#7C3AED] dark:text-[#A78BFA]'
                    : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={motionEnabled ? 'mobile-nav-pill' : undefined}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  aria-hidden="true"
                  className="absolute top-0.5 h-0.5 w-7 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#FF5A5F]"
                />
              )}
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className="flex min-h-[44px] min-w-[54px] flex-col items-center justify-center text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>
            {t.nav.cart} ({totalItems})
          </span>
        </button>
      </nav>
    </>
  );
};
