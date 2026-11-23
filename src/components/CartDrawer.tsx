import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingBag, Trash2, X, Tag, Percent } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { api } from '../lib/api.ts';
import { calculateCartPricing } from '../lib/pricing.ts';
import { HelpTooltip } from './HelpTooltip.tsx';
import { AnimatedNumber, useMotionEnabled } from './MotionPrimitives.tsx';

export const CartDrawer: React.FC = () => {
  const t = useT();
  const motionEnabled = useMotionEnabled();
  const open = useAppStore((s) => s.cartDrawerOpen);
  const setOpen = useAppStore((s) => s.setCartDrawerOpen);
  const cart = useAppStore((s) => s.cart);
  const updateQty = useAppStore((s) => s.updateCartQuantity);
  const removeItem = useAppStore((s) => s.removeFromCart);
  const storedCoupon = useAppStore((s) => s.appliedCouponCode);
  const setStoredCoupon = useAppStore((s) => s.setAppliedCouponCode);

  const [couponCode, setCouponCode] = useState(storedCoupon || '');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponErr, setCouponErr] = useState('');

  const pricing = calculateCartPricing(cart, 'standard', discount);

  useEffect(() => {
    if (storedCoupon && storedCoupon !== couponCode) {
      setCouponCode(storedCoupon);
    }
  }, [storedCoupon]);

  useEffect(() => {
    const activeCode = (storedCoupon || '').trim();
    if (!activeCode || pricing.subtotal === 0) {
      if (!activeCode) {
        setDiscount(0);
        setCouponMsg('');
      }
      return;
    }
    api
      .validateCoupon(activeCode, pricing.subtotal)
      .then((res) => {
        setDiscount(res.discountAmount);
        setCouponMsg(`Saved Rs ${res.discountAmount} with ${res.coupon.code}!`);
        setCouponErr('');
      })
      .catch((err) => {
        setDiscount(0);
        setCouponMsg('');
        setCouponErr(err instanceof Error ? err.message : 'Coupon could not be applied yet.');
      });
  }, [storedCoupon, pricing.subtotal]);

  const applyCodeValue = async (codeToTry: string) => {
    setCouponErr('');
    setCouponMsg('');
    const clean = codeToTry.trim().toUpperCase();
    if (!clean) return;
    setCouponCode(clean);
    try {
      const res = await api.validateCoupon(clean, pricing.subtotal);
      setDiscount(res.discountAmount);
      setStoredCoupon(res.coupon.code);
      setCouponMsg(`Saved Rs ${res.discountAmount} with ${res.coupon.code}!`);
    } catch (err) {
      setDiscount(0);
      setCouponErr(err instanceof Error ? err.message : 'Coupon could not be applied.');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyCodeValue(couponCode);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cart-drawer-backdrop"
          initial={motionEnabled ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={motionEnabled ? { opacity: 0 } : undefined}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
          onClick={() => setOpen(false)}
        >
          <motion.div
            key="cart-drawer-panel"
            initial={motionEnabled ? { x: '100%' } : false}
            animate={{ x: 0 }}
            exit={motionEnabled ? { x: '100%' } : undefined}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="flex h-full w-full max-w-md flex-col border-l border-black/10 bg-white/98 text-[#111116] shadow-2xl dark:border-white/10 dark:bg-[#14141A]/98 dark:text-[#F5F5F7]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-[#7C3AED]" />
                <h2 className="font-display text-lg font-bold">
                  Your Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h2>
              </div>
              <motion.button
                type="button"
                whileTap={motionEnabled ? { scale: 0.9 } : undefined}
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Free Delivery & Bundle Progress Bars */}
            {cart.length > 0 && (
              <div className="space-y-2.5 border-b border-black/6 bg-zinc-50/80 px-6 py-3.5 dark:border-white/6 dark:bg-[#191923]">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    {pricing.freeDeliveryUnlocked ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {t.shopping.freeDeliveryUnlocked}
                      </span>
                    ) : (
                      <span className="text-zinc-600 dark:text-zinc-300">
                        <strong>Rs {pricing.freeDeliveryRemaining}</strong> {t.shopping.freeDeliveryNeedMore}
                      </span>
                    )}
                    <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                      {pricing.freeDeliveryPct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
                    <motion.div
                      initial={false}
                      animate={{ width: `${pricing.freeDeliveryPct}%` }}
                      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                      className={`h-full rounded-full ${
                        pricing.freeDeliveryUnlocked
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-[#7C3AED] to-[#FF5A5F]'
                      }`}
                    />
                  </div>
                </div>

                {/* Bundle 10% off status */}
                <div
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                    pricing.bundleUnlocked
                      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[#7C3AED]/10 text-[#6D28D9] dark:text-[#C4B5FD]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 shrink-0" />
                    {pricing.bundleUnlocked
                      ? `${t.shopping.bundleUnlocked} (-Rs ${pricing.bundleDiscount})`
                      : pricing.bundleEligibleQty === 1
                        ? t.shopping.bundleNeedOne
                        : t.shopping.bundleNeedTwo}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED]">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{t.common.emptyCartTitle}</h3>
                  <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {t.common.emptyCartDesc}
                  </p>
                  <Link
                    to="/shop"
                    onClick={() => setOpen(false)}
                    className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white hover:bg-[#6D28D9]"
                  >
                    {t.common.startShopping}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout={motionEnabled}
                        initial={motionEnabled ? { opacity: 0, y: 12, scale: 0.97 } : false}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={motionEnabled ? { opacity: 0, x: 40, scale: 0.95 } : undefined}
                        transition={{ duration: 0.22 }}
                        className="flex gap-4 rounded-2xl border border-black/10 bg-white/80 p-3.5 dark:border-white/10 dark:bg-[#191922]"
                      >
                        <img
                          src={item.designPreviewUrl || item.imageUrl}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="h-20 w-20 shrink-0 rounded-xl bg-zinc-100 object-cover dark:bg-[#1E1E28]"
                        />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold leading-snug">{item.productName}</h3>
                              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                {item.size} · {item.colorName}
                                {item.printArea !== 'none' ? ` · Print: ${item.printArea}` : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.productName}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-xl border border-black/10 dark:border-white/10">
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.quantity - 1)}
                                aria-label="Decrease quantity"
                                className="flex h-10 w-10 items-center justify-center transition hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                                className="flex h-10 w-10 items-center justify-center transition hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <AnimatedNumber
                              value={item.unitPrice * item.quantity}
                              prefix="Rs "
                              className="font-bold"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <form onSubmit={handleApplyCoupon} className="pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="cart-coupon"
                        className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                      >
                        Have a coupon code?
                      </label>
                      {couponCode.toUpperCase() !== 'WELCOME10' && (
                        <button
                          type="button"
                          onClick={() => applyCodeValue('WELCOME10')}
                          className="text-xs font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA]"
                        >
                          Tap to apply WELCOME10
                        </button>
                      )}
                    </div>
                    <div className="mt-1.5 flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-zinc-400" />
                        <input
                          id="cart-coupon"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="WELCOME10"
                          className="min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent pr-3 pl-9 text-sm uppercase dark:border-white/15"
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-[#111116]"
                      >
                        Apply Code
                      </button>
                    </div>
                    {couponMsg && <p className="mt-1.5 text-xs font-medium text-emerald-500">{couponMsg}</p>}
                    {couponErr && <p className="mt-1.5 text-xs font-medium text-red-500">{couponErr}</p>}
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {t.enhancements.welcomeStackNote}
                    </p>
                  </form>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-black/10 p-6 dark:border-white/10">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Items total (18% GST incl.)</span>
                    <AnimatedNumber value={pricing.subtotal} prefix="Rs " className="font-semibold" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center text-zinc-600 dark:text-zinc-400">
                      Delivery (3-5 days)
                      <HelpTooltip
                        label="About delivery fee"
                        text="Standard delivery is Rs 79, or FREE when your order is Rs 599 or more. Most orders arrive in 3 to 5 days."
                      />
                    </span>
                    <span className="font-semibold tabular-nums">
                      {pricing.shippingFee === 0 ? 'Free' : `Rs ${pricing.shippingFee}`}
                    </span>
                  </div>
                  {pricing.bundleDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>{t.shopping.bundleSavingsLabel}</span>
                      <AnimatedNumber
                        value={pricing.bundleDiscount}
                        prefix="-Rs "
                        className="font-semibold"
                      />
                    </div>
                  )}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Coupon savings</span>
                      <AnimatedNumber
                        value={pricing.couponDiscount}
                        prefix="-Rs "
                        className="font-semibold"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base font-bold dark:border-white/10">
                    <span>Total (18% GST incl.)</span>
                    <AnimatedNumber value={pricing.totalAmount} prefix="Rs " />
                  </div>
                </div>

                <Link
                  to={`/checkout${couponCode && pricing.couponDiscount > 0 ? `?coupon=${encodeURIComponent(couponCode.toUpperCase())}` : ''}`}
                  onClick={() => setOpen(false)}
                  className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#7C3AED] px-6 text-base font-semibold text-white shadow-lg shadow-[#7C3AED]/25 transition hover:-translate-y-0.5 hover:bg-[#6D28D9] active:scale-[0.98]"
                >
                  {t.common.payAndPlaceOrder}
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
