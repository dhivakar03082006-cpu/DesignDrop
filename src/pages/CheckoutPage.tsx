import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import confetti from 'canvas-confetti';
import { Check, CreditCard, Truck, MapPin, FileDown, FileText, ArrowRight, ShieldCheck, Percent } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { api } from '../lib/api.ts';
import { calculateCartPricing } from '../lib/pricing.ts';
import { downloadOrderInvoicePdf } from '../lib/invoicePdf.ts';
import { GstInvoiceModal } from '../components/GstInvoiceModal.tsx';
import { HelpTooltip } from '../components/HelpTooltip.tsx';
import { useMotionEnabled } from '../components/MotionPrimitives.tsx';
import type { Order } from '../types/index.ts';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Please write your full name so we know who to deliver to.'),
  email: z.string().email("That email doesn't look right. Please check it and try again."),
  phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a 10-digit phone number (numbers only).'),
  street: z.string().min(5, 'Please enter your house number and street name.'),
  city: z.string().min(2, 'Please enter your town or city.'),
  state: z.string().min(2, 'Please enter your state.'),
  postalCode: z.string().regex(/^[0-9]{6}$/, 'Please enter a 6-digit PIN code.'),
});

type AddressForm = z.infer<typeof addressSchema>;

export const CheckoutPage: React.FC = () => {
  const t = useT();
  const [searchParams] = useSearchParams();
  const cart = useAppStore((s) => s.cart);
  const clearCart = useAppStore((s) => s.clearCart);
  const user = useAppStore((s) => s.user);
  const liteMode = useAppStore((s) => s.liteMode);
  const motionEnabled = useMotionEnabled();
  const addNotification = useAppStore((s) => s.addNotification);
  const showToast = useAppStore((s) => s.showToast);
  const storedCoupon = useAppStore((s) => s.appliedCouponCode);
  const setStoredCoupon = useAppStore((s) => s.setAppliedCouponCode);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay_test' | 'cod'>('razorpay_test');
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') || storedCoupon || '');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [razorpayModal, setRazorpayModal] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const savedAddr = user?.addresses?.[0];

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: savedAddr?.fullName || user?.fullName || '',
      email: savedAddr?.email || user?.email || '',
      phone: savedAddr?.phone || user?.phone || '',
      street: savedAddr?.street || '',
      city: savedAddr?.city || '',
      state: savedAddr?.state || '',
      postalCode: savedAddr?.postalCode || '',
    },
  });

  const pricing = calculateCartPricing(cart, deliveryMethod, couponDiscount);
  const { subtotal, gstIncluded, shippingFee, totalAmount } = pricing;

  useEffect(() => {
    if (!couponCode || subtotal === 0) return;
    api
      .validateCoupon(couponCode, subtotal)
      .then((res) => setCouponDiscount(res.discountAmount))
      .catch(() => setCouponDiscount(0));
  }, [couponCode, subtotal]);

  const applyCoupon = async (overrideCode?: string) => {
    const code = (overrideCode ?? couponCode).trim().toUpperCase();
    if (!code) return;
    setCouponCode(code);
    try {
      const res = await api.validateCoupon(code, subtotal);
      setCouponDiscount(res.discountAmount);
      setStoredCoupon(res.coupon.code);
      showToast(`Saved Rs ${res.discountAmount} with ${res.coupon.code}!`, 'success');
    } catch (err) {
      setCouponDiscount(0);
      showToast(err instanceof Error ? err.message : 'Coupon code not found.', 'error');
    }
  };

  const finalizeOrder = async (paymentRef?: string) => {
    setPlacing(true);
    try {
      const addr = getValues();
      const order = await api.createOrder({
        userId: user?.id,
        shippingAddress: addr,
        deliveryMethod,
        paymentMethod,
        paymentRef,
        subtotal,
        gstAmount: gstIncluded,
        shippingFee,
        discountAmount: pricing.totalDiscount,
        totalAmount,
        couponCode: pricing.couponDiscount > 0 ? couponCode.toUpperCase() : undefined,
        items: cart,
      });

      clearCart();
      setStoredCoupon('');
      setPlacedOrder(order);
      addNotification({
        title: `Order ${order.orderNumber} Placed`,
        message: "We got your order and will check your print artwork soon.",
        orderNumber: order.orderNumber,
      });

      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!liteMode && !reduced) {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      }
      showToast("Your order is placed! 🎉 We've sent the details to your email.", 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not place order.', 'error');
    } finally {
      setPlacing(false);
      setRazorpayModal(false);
    }
  };

  const handlePaymentAction = async () => {
    if (paymentMethod === 'razorpay_test') {
      setRazorpayModal(true);
    } else {
      await finalizeOrder();
    }
  };

  const handleRazorpayConfirm = async () => {
    try {
      const res = await api.createRazorpayTestPayment(totalAmount);
      await finalizeOrder(res.paymentId);
    } catch {
      showToast('Test payment could not finish. Please try again.', 'error');
    }
  };

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-emerald-500/30 bg-white p-8 text-center shadow-xl dark:bg-[#16161D]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold">
            Your order is placed! 🎉
          </h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-300">
            We sent the receipt to <strong>{placedOrder.customerEmail}</strong>. Your order number is{' '}
            <strong className="font-mono text-[#7C3AED] dark:text-[#A78BFA]">
              {placedOrder.orderNumber}
            </strong>.
          </p>

          <div className="mt-6 rounded-2xl border border-black/10 p-5 text-left text-sm dark:border-white/10">
            <div className="flex justify-between">
              <span className="text-zinc-500">Paid via</span>
              <span className="font-semibold">
                {placedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay Test Mode'}
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-zinc-500">Total (includes 18% GST)</span>
              <span className="font-bold tabular-nums">Rs {placedOrder.totalAmount}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3 sm:justify-center">
            <button
              type="button"
              onClick={() => setInvoiceModalOpen(true)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-5 text-sm font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/15 dark:text-[#A78BFA]"
            >
              <FileText className="h-4 w-4" />
              {t.enhancements.viewGstInvoice}
            </button>
            <button
              type="button"
              onClick={() => downloadOrderInvoicePdf(placedOrder)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-black/15 px-5 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              <FileDown className="h-4 w-4" />
              {t.enhancements.downloadPdf}
            </button>
            <Link
              to={`/track?id=${encodeURIComponent(placedOrder.orderNumber)}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white hover:bg-[#6D28D9]"
            >
              Track My Order
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <GstInvoiceModal
          order={invoiceModalOpen ? placedOrder : null}
          onClose={() => setInvoiceModalOpen(false)}
        />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty.</h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Let&apos;s find a T-shirt or mug you&apos;ll love before checking out.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const stepLabels = ['Address', 'Delivery', 'Payment'];

  return (
    <div className="mx-auto max-w-[1140px] px-4 py-10 sm:px-6">
      {/* Animated Stepper & Progress Indicator */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-black/8 bg-white/90 p-1.5 backdrop-blur-md dark:border-white/10 dark:bg-[#16161D]/90">
            {stepLabels.map((label, idx) => {
              const stepNum = (idx + 1) as 1 | 2 | 3;
              const active = step === stepNum;
              const done = step > stepNum;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={stepNum > step}
                  onClick={() => {
                    if (stepNum < step) setStep(stepNum);
                  }}
                  className={`relative inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-white'
                      : done
                        ? 'text-emerald-600 hover:bg-black/5 dark:text-emerald-400 dark:hover:bg-white/10'
                        : 'text-zinc-500 disabled:cursor-default'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={motionEnabled ? 'checkout-step-pill' : undefined}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl bg-[#7C3AED]"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {done ? <Check className="h-3.5 w-3.5" /> : <span className="font-mono">0{stepNum}</span>}
                    <span>{label}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Guest checkout enabled · No signup needed
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <motion.div
            initial={false}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#FF5A5F]"
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Step Area */}
        <div className="lg:col-span-7">
          {step === 1 && (
            <form
              onSubmit={handleSubmit(() => setStep(2))}
              className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#16161D]"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-[#7C3AED]" />
                <h1 className="font-display text-2xl font-bold">Where should we deliver?</h1>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block text-sm font-semibold">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    {...register('fullName')}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-black/15 bg-transparent px-4 text-base dark:border-white/15"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs font-medium text-red-500">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-black/15 bg-transparent px-4 text-base dark:border-white/15"
                  />
                  <p className="mt-1 text-xs text-zinc-500">We&apos;ll send your receipt and tracking link here.</p>
                  {errors.email && (
                    <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-black/15 bg-transparent px-4 text-base dark:border-white/15"
                  />
                  <p className="mt-1 text-xs text-zinc-500">We&apos;ll only use it to update you about your delivery.</p>
                  {errors.phone && (
                    <p className="mt-1 text-xs font-medium text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="street" className="block text-sm font-semibold">
                    House No. & Street Address
                  </label>
                  <input
                    id="street"
                    {...register('street')}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-black/15 bg-transparent px-4 text-base dark:border-white/15"
                  />
                  {errors.street && (
                    <p className="mt-1 text-xs font-medium text-red-500">{errors.street.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-semibold">
                    City / Town
                  </label>
                  <input
                    id="city"
                    {...register('city')}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-black/15 bg-transparent px-4 text-base dark:border-white/15"
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs font-medium text-red-500">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-semibold">
                    State
                  </label>
                  <input
                    id="state"
                    {...register('state')}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-black/15 bg-transparent px-4 text-base dark:border-white/15"
                  />
                  {errors.state && (
                    <p className="mt-1 text-xs font-medium text-red-500">{errors.state.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="postalCode" className="block text-sm font-semibold">
                    PIN Code (6 digits)
                  </label>
                  <input
                    id="postalCode"
                    {...register('postalCode')}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-black/15 bg-transparent px-4 text-base dark:border-white/15"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-xs font-medium text-red-500">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] text-base font-semibold text-white hover:bg-[#6D28D9]"
              >
                Next: Choose Delivery Speed
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#16161D]">
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-[#7C3AED]" />
                <h1 className="font-display text-2xl font-bold">How fast do you need it?</h1>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('standard')}
                  className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition ${
                    deliveryMethod === 'standard'
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-black/15 dark:border-white/15'
                  }`}
                >
                  <div>
                    <div className="font-display text-base font-bold">Standard Delivery (3–5 days)</div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Free on orders Rs 599 and above.
                    </p>
                  </div>
                  <span className="text-base font-bold tabular-nums">
                    {subtotal >= 599 ? 'Free' : 'Rs 79'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('express')}
                  className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition ${
                    deliveryMethod === 'express'
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-black/15 dark:border-white/15'
                  }`}
                >
                  <div>
                    <div className="font-display text-base font-bold">Express Air Delivery (1–2 days)</div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Priority printing and next-day dispatch.
                    </p>
                  </div>
                  <span className="text-base font-bold tabular-nums">Rs 149</span>
                </button>
              </div>

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[48px] rounded-2xl border border-black/15 px-6 text-sm font-semibold dark:border-white/15"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] text-base font-semibold text-white hover:bg-[#6D28D9]"
                >
                  Next: Choose Payment
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#16161D]">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-5 w-5 text-[#7C3AED]" />
                <h1 className="font-display text-2xl font-bold">Choose how to pay</h1>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay_test')}
                  className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition ${
                    paymentMethod === 'razorpay_test'
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-black/15 dark:border-white/15'
                  }`}
                >
                  <div>
                    <div className="font-display text-base font-bold">Pay Online (Razorpay Test Mode)</div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Try UPI, card, or netbanking safely in test mode — no real money charged.
                    </p>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition ${
                    paymentMethod === 'cod'
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-black/15 dark:border-white/15'
                  }`}
                >
                  <div>
                    <div className="font-display text-base font-bold">Cash on Delivery (COD)</div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Pay in cash or UPI when your box arrives at your door.
                    </p>
                  </div>
                </button>
              </div>

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[48px] rounded-2xl border border-black/15 px-6 text-sm font-semibold dark:border-white/15"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={placing}
                  onClick={handlePaymentAction}
                  className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-6 text-base font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50"
                >
                  {placing ? 'Placing your order...' : `Pay and Place Order (Rs ${totalAmount})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Clear Price Summary */}
        <aside className="lg:col-span-5">
          <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
            <h2 className="font-display text-lg font-bold">Order Summary ({cart.length} items)</h2>
            <div className="mt-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <img
                    src={item.designPreviewUrl || item.imageUrl}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-xl object-cover bg-zinc-100 dark:bg-[#1E1E28]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{item.productName}</div>
                    <div className="text-xs text-zinc-500">
                      {item.size} · {item.colorName} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold tabular-nums">Rs {item.unitPrice * item.quantity}</div>
                </div>
              ))}
            </div>

            {/* Free Delivery Progress & Bundle Offer Status */}
            <div className="mt-4 space-y-2 rounded-2xl border border-black/8 bg-zinc-50/80 p-3.5 dark:border-white/10 dark:bg-[#1B1B24]/80">
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
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  style={{ width: `${pricing.freeDeliveryPct}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    pricing.freeDeliveryUnlocked
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-[#7C3AED] to-[#FF5A5F]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-[#6D28D9] dark:text-[#C4B5FD]">
                <Percent className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {pricing.bundleUnlocked
                    ? `${t.shopping.bundleUnlocked} (-Rs ${pricing.bundleDiscount})`
                    : pricing.bundleEligibleQty === 1
                      ? t.shopping.bundleNeedOne
                      : t.shopping.bundleNeedTwo}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">Promo / First Order Code</span>
                {couponCode.toUpperCase() !== 'WELCOME10' && (
                  <button
                    type="button"
                    onClick={() => applyCoupon('WELCOME10')}
                    className="font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA]"
                  >
                    Apply WELCOME10
                  </button>
                )}
              </div>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code (WELCOME10)"
                  aria-label="Coupon code"
                  className="min-h-[44px] flex-1 rounded-xl border border-black/15 bg-transparent px-3 text-sm uppercase dark:border-white/15"
                />
                <button
                  type="button"
                  onClick={() => applyCoupon()}
                  className="min-h-[44px] rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-[#111116]"
                >
                  Apply
                </button>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t.enhancements.welcomeStackNote}
              </p>
            </div>

            <div className="mt-5 space-y-2 border-t border-black/10 pt-4 text-sm dark:border-white/10">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Items total</span>
                <span className="font-semibold tabular-nums">Rs {subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center text-zinc-600 dark:text-zinc-400">
                  Included 18% GST tax
                  <HelpTooltip
                    label="About GST tax"
                    text="GST is government sales tax. It is already inside the item prices shown, so nothing extra is added here."
                  />
                </span>
                <span className="tabular-nums text-zinc-500">Rs {gstIncluded} (included)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Delivery</span>
                <span className="font-semibold tabular-nums">
                  {shippingFee === 0 ? 'Free' : `Rs ${shippingFee}`}
                </span>
              </div>
              {pricing.bundleDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>{t.shopping.bundleSavingsLabel}</span>
                  <span className="font-semibold tabular-nums">-Rs {pricing.bundleDiscount}</span>
                </div>
              )}
              {pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon savings</span>
                  <span className="font-semibold tabular-nums">-Rs {pricing.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-black/10 pt-3 text-lg font-extrabold dark:border-white/10">
                <span>Total (18% GST incl.)</span>
                <span className="tabular-nums">Rs {totalAmount}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Razorpay Test Mode Checkout Modal */}
      {razorpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-[#111116] shadow-2xl dark:bg-[#16161D] dark:text-[#F5F5F7]">
            <h2 className="font-display text-xl font-bold">Razorpay Test Mode</h2>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              This is a safe test payment screen. No real money will be taken.
            </p>
            <div className="mt-4 rounded-2xl bg-zinc-100 p-4 dark:bg-[#1E1E28]">
              <div className="text-xs text-zinc-500">Amount to pay</div>
              <div className="text-2xl font-extrabold tabular-nums">Rs {totalAmount}</div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setRazorpayModal(false)}
                className="min-h-[48px] flex-1 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/15"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={placing}
                onClick={handleRazorpayConfirm}
                className="min-h-[48px] flex-1 rounded-xl bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9]"
              >
                {placing ? 'Paying...' : 'Complete Test Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
