import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FileDown, Printer, X, ShieldCheck, MapPin } from 'lucide-react';
import { downloadOrderInvoicePdf } from '../lib/invoicePdf.ts';
import { useT } from '../hooks/useT.ts';
import { DesignDropLogo } from './DesignDropLogo.tsx';
import { useMotionEnabled } from './MotionPrimitives.tsx';
import type { Order } from '../types/index.ts';

interface GstInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const GstInvoiceModal: React.FC<GstInvoiceModalProps> = ({ order, onClose }) => {
  const t = useT();
  const motionEnabled = useMotionEnabled();

  useEffect(() => {
    if (!order) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [order, onClose]);

  const taxableSubtotal = order ? Math.max(0, order.subtotal - order.discountAmount) : 0;
  const gstAmount = order
    ? order.gstAmount || Math.round(taxableSubtotal - taxableSubtotal / 1.18)
    : 0;
  const basePriceBeforeTax = Math.max(0, taxableSubtotal - gstAmount);
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          key="gst-invoice-backdrop"
          initial={motionEnabled ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={motionEnabled ? { opacity: 0 } : undefined}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gst-invoice-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-[3px] sm:p-5 print:static print:bg-white print:p-0"
        >
          <motion.div
            key="gst-invoice-panel"
            initial={motionEnabled ? { opacity: 0, scale: 0.96, y: 12 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={motionEnabled ? { opacity: 0, scale: 0.96, y: 10 } : undefined}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/10 bg-white text-[#111116] shadow-2xl dark:border-white/10 dark:bg-[#14141B] dark:text-[#F5F5F7] print:max-h-none print:overflow-visible print:rounded-none print:border-none print:bg-white print:text-black print:shadow-none"
          >
            {/* Top Toolbar (hidden in print) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-6 py-4 dark:border-white/10 print:hidden">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="h-5 w-5 text-[#7C3AED]" />
                <span id="gst-invoice-title">{t.enhancements.taxInvoiceTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/15 px-3.5 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  <Printer className="h-4 w-4" />
                  {t.enhancements.printInvoice}
                </button>
                <button
                  type="button"
                  onClick={() => downloadOrderInvoicePdf(order)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7C3AED] px-3.5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                >
                  <FileDown className="h-4 w-4" />
                  {t.enhancements.downloadPdf}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close invoice"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 sm:p-8">
              {/* Studio Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5 dark:border-white/10 print:border-zinc-300">
                <div>
                  <DesignDropLogo size="md" variant="invoice" interactive={false} />
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 print:text-zinc-700">
                    Custom T-Shirts &amp; Ceramic Mugs Print Studio
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 print:text-zinc-700">
                    GSTIN: 33AABCD1234E1Z5 · support@designdrop.in
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                    TAX INVOICE (18% GST)
                  </div>
                  <div className="mt-1 font-mono text-base font-extrabold">
                    INV-{order.orderNumber}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Order ID: <strong className="font-mono">{order.orderNumber}</strong> ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Billing & Delivery Details */}
              <div className="mt-5 grid gap-4 rounded-2xl border border-black/8 bg-zinc-50/80 p-4 text-xs sm:grid-cols-2 dark:border-white/10 dark:bg-[#1B1B24]/80 print:border-zinc-300 print:bg-zinc-50">
                <div>
                  <div className="font-semibold uppercase tracking-wide text-zinc-500">
                    Billed &amp; Shipped To
                  </div>
                  <div className="mt-1.5 text-sm font-bold">{order.customerName}</div>
                  <div className="mt-0.5 text-zinc-600 dark:text-zinc-300 print:text-zinc-700">
                    {order.shippingAddress.street}
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-300 print:text-zinc-700">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 font-semibold text-[#7C3AED] dark:text-[#A78BFA] print:text-black">
                    <MapPin className="h-3.5 w-3.5" />
                    {t.enhancements.deliveryPin}: {order.shippingAddress.postalCode}
                  </div>
                </div>

                <div className="space-y-1.5 sm:text-right">
                  <div className="font-semibold uppercase tracking-wide text-zinc-500">
                    Payment &amp; Status
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 print:text-zinc-800">
                    Phone: <strong className="tabular-nums">{order.customerPhone}</strong>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 print:text-zinc-800">
                    Email: <strong>{order.customerEmail}</strong>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 print:text-zinc-800">
                    Payment:{' '}
                    <strong>
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay Online'} (
                      {order.paymentStatus})
                    </strong>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 print:text-zinc-800">
                    Status: <strong>{order.status}</strong>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mt-5 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 print:border-zinc-300">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-zinc-100/90 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-[#1E1E28] dark:text-zinc-300 print:bg-zinc-100 print:text-zinc-700">
                    <tr>
                      <th className="px-4 py-3">Item &amp; Specs</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Unit (incl. GST)</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/8 dark:divide-white/8 print:divide-zinc-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{item.productName}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Size: {item.size} · Color: {item.colorName}
                            {item.printArea !== 'none' ? ` · Print: ${item.printArea}` : ''}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">Rs {item.unitPrice}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">
                          Rs {item.unitPrice * item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Base Price + 18% GST Breakdown */}
              <div className="mt-5 ml-auto max-w-sm space-y-2 rounded-2xl border border-black/8 bg-zinc-50/70 p-4 text-sm dark:border-white/10 dark:bg-[#1B1B24]/70 print:border-zinc-300 print:bg-white">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>{t.enhancements.basePriceBeforeTax}</span>
                  <span className="font-semibold tabular-nums">Rs {basePriceBeforeTax}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>{t.enhancements.cgstLabel}</span>
                  <span className="tabular-nums">Rs {cgst}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>{t.enhancements.sgstLabel}</span>
                  <span className="tabular-nums">Rs {sgst}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>
                      Savings {order.couponCode ? `(${order.couponCode})` : '(Bundle / Promo)'}
                    </span>
                    <span className="font-semibold tabular-nums">-Rs {order.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>Delivery ({order.deliveryMethod})</span>
                  <span className="font-semibold tabular-nums">
                    {order.shippingFee === 0 ? 'Free' : `Rs ${order.shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-2.5 text-base font-extrabold dark:border-white/10 print:border-zinc-300">
                  <span>{t.enhancements.grandTotalTaxIncl}</span>
                  <span className="tabular-nums">Rs {order.totalAmount}</span>
                </div>
              </div>

              <p className="mt-5 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                18% GST (9% CGST + 9% SGST) is already included in all product prices. Thank you for creating with DesignDrop!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
