import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Truck, CheckCircle2, FileDown, FileText, RotateCcw, XCircle } from 'lucide-react';
import { api } from '../lib/api.ts';
import { downloadOrderInvoicePdf } from '../lib/invoicePdf.ts';
import { subscribeToOrderRealtime } from '../lib/supabase.ts';
import { GstInvoiceModal } from '../components/GstInvoiceModal.tsx';
import { useT } from '../hooks/useT.ts';
import { useAppStore } from '../store/useAppStore.ts';
import type { Order, OrderStatus } from '../types/index.ts';

const TIMELINE_STEPS: OrderStatus[] = [
  'Order Received',
  'Design Checked',
  'Printing Your Item',
  'Packed',
  'On the Way',
  'Out for Delivery',
  'Delivered',
];

export const TrackOrderPage: React.FC = () => {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useAppStore((s) => s.showToast);
  const addNotification = useAppStore((s) => s.addNotification);

  const [orderInput, setOrderInput] = useState(searchParams.get('id') || 'DD-1042');
  const [order, setOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const lookupOrder = async (num: string) => {
    const clean = num.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const found = await api.getOrderByNumber(clean);
      setOrder(found);
      setSearchParams({ id: found.orderNumber });
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getOrders().then(setRecentOrders).catch(() => {});
    lookupOrder(searchParams.get('id') || 'DD-1042');
  }, []);

  // Real-time SSE listener from Admin status updates
  useEffect(() => {
    const es = new EventSource('/api/events');
    es.addEventListener('order_updated', (ev) => {
      try {
        const updated = JSON.parse((ev as MessageEvent).data) as Order;
        setRecentOrders((prev) =>
          prev.map((o) => (o.orderNumber === updated.orderNumber ? updated : o))
        );
        setOrder((cur) => {
          if (cur && cur.orderNumber === updated.orderNumber) {
            showToast(`Order ${updated.orderNumber} updated: ${updated.status}`, 'info');
            addNotification({
              title: `Order ${updated.orderNumber} Update`,
              message: `Status is now "${updated.status}".`,
              orderNumber: updated.orderNumber,
            });
            return updated;
          }
          return cur;
        });
      } catch {
        // Ignore parse error
      }
    });
    return () => es.close();
  }, []);

  // Optional Supabase Realtime listener when env vars are configured
  useEffect(() => {
    if (!order?.orderNumber) return;
    const unsubscribe = subscribeToOrderRealtime(order.orderNumber, () => {
      api
        .getOrderByNumber(order.orderNumber)
        .then((fresh) => setOrder(fresh))
        .catch(() => {});
    });
    return unsubscribe;
  }, [order?.orderNumber]);

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      const updated = await api.cancelOrder(order.orderNumber, 'Customer requested cancellation');
      setOrder(updated);
      setConfirmCancelOpen(false);
      showToast('Your order has been cancelled.', 'info');
    } catch (err) {
      setConfirmCancelOpen(false);
      showToast(err instanceof Error ? err.message : 'Could not cancel order.', 'error');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      const updated = await api.requestReturn(order.orderNumber, returnReason || 'Size or print issue');
      setOrder(updated);
      setReturnModalOpen(false);
      setReturnReason('');
      showToast('Return request sent! We will message you within 24 hours.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send return request.', 'error');
    }
  };

  const currentIdx = order ? TIMELINE_STEPS.indexOf(order.status) : -1;
  const progressPercent =
    currentIdx >= 0 ? Math.round(((currentIdx + 1) / TIMELINE_STEPS.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Track My Order
      </h1>
      <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
        Enter your order number to see live progress. Updates appear here automatically.
      </p>

      {/* Search Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookupOrder(orderInput);
        }}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-3.5 left-3.5 h-5 w-5 text-zinc-400" />
          <input
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            placeholder="Enter Order ID (for example: DD-1042)"
            aria-label="Order number"
            className="min-h-[48px] w-full rounded-xl border border-black/15 bg-white pr-4 pl-11 text-base uppercase dark:border-white/15 dark:bg-[#16161D]"
          />
        </div>
        <button
          type="submit"
          className="min-h-[48px] rounded-xl bg-[#7C3AED] px-6 text-base font-semibold text-white hover:bg-[#6D28D9]"
        >
          Track My Order
        </button>
      </form>

      {/* Sample / Recent Order Quick Buttons */}
      {recentOrders.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500">Recent orders:</span>
          {recentOrders.slice(0, 4).map((ro) => (
            <button
              key={ro.id}
              type="button"
              onClick={() => {
                setOrderInput(ro.orderNumber);
                lookupOrder(ro.orderNumber);
              }}
              className="min-h-[36px] rounded-lg border border-black/15 px-3 font-mono font-semibold hover:border-[#7C3AED] dark:border-white/15"
            >
              {ro.orderNumber}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-8 h-64 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm font-medium text-red-500">
          {error}
        </div>
      )}

      {order && !loading && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Animated Vertical Timeline */}
          <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 lg:col-span-7 dark:border-white/10 dark:bg-[#16161D]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4 dark:border-white/10">
              <div>
                <div className="text-xs font-medium text-zinc-500">Order Number</div>
                <div className="font-mono text-xl font-bold">{order.orderNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-zinc-500">Right Now</div>
                <div className="text-base font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                  {order.status}
                </div>
              </div>
            </div>

            {order.status === 'Cancelled' || order.status === 'Return Requested' ? (
              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm">
                <strong>{order.status}:</strong>{' '}
                {order.tracking[order.tracking.length - 1]?.note}
              </div>
            ) : (
              <div className="relative mt-8 pl-10">
                {/* Background Vertical Line */}
                <div className="absolute top-3 bottom-3 left-4 w-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                {/* Glowing Animated Progress Line */}
                <div
                  className="absolute top-3 left-4 w-1 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#FF5A5F] transition-all duration-500"
                  style={{ height: `calc(${progressPercent}% - 24px)` }}
                />

                {/* Moving Delivery Truck Icon */}
                <div
                  className="absolute left-0.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/40 transition-all duration-500"
                  style={{ top: `calc(${Math.max(4, progressPercent - 8)}% )` }}
                  aria-hidden="true"
                >
                  <Truck className="h-4 w-4" />
                </div>

                <div className="space-y-6">
                  {TIMELINE_STEPS.map((stepName, idx) => {
                    const done = idx <= currentIdx;
                    const log = order.tracking.find((t) => t.status === stepName);
                    return (
                      <div key={stepName} className="relative">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-base font-bold ${
                              done ? 'text-[#111116] dark:text-[#F5F5F7]' : 'text-zinc-400 dark:text-zinc-600'
                            }`}
                          >
                            {stepName}
                          </span>
                          {log && (
                            <span className="text-xs text-zinc-500 tabular-nums">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                          {log?.note || (done ? 'Completed' : 'Waiting for this step')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order Actions & Summary */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
              <h2 className="font-display text-lg font-bold">Items in this order</h2>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
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
                    <span className="font-bold tabular-nums">Rs {item.unitPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-black/10 pt-3 text-sm dark:border-white/10">
                <div className="flex justify-between font-bold">
                  <span>Total (Tax included)</span>
                  <span className="tabular-nums">Rs {order.totalAmount}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(true)}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9]"
                >
                  <FileText className="h-4 w-4" />
                  {t.enhancements.viewGstInvoice}
                </button>

                <button
                  type="button"
                  onClick={() => downloadOrderInvoicePdf(order)}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-black/15 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  <FileDown className="h-4 w-4" />
                  Download Tax Invoice (PDF)
                </button>

                {['Order Received', 'Design Checked'].includes(order.status) && (
                  <button
                    type="button"
                    onClick={() => setConfirmCancelOpen(true)}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </button>
                )}

                {order.status !== 'Cancelled' && order.status !== 'Return Requested' && (
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(true)}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-black/15 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Ask for Return or Refund
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-[#16161D]">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Delivering to
              </div>
              <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} — {order.shippingAddress.postalCode}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {confirmCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#16161D]">
            <h3 className="font-display text-lg font-bold">Cancel this order?</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Cancel this order? You can&apos;t undo this.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancelOrder}
                className="min-h-[44px] flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, Cancel
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/15"
              >
                No, Keep It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Refund Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleReturnSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#16161D]"
          >
            <h3 className="font-display text-lg font-bold">Ask for a Return or Refund</h3>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              Tell us what went wrong. We replace damaged or wrong prints for free within 7 days.
            </p>
            <textarea
              required
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="For example: Wrong size or print got smudged..."
              className="mt-4 w-full rounded-xl border border-black/15 bg-transparent p-3 text-sm dark:border-white/15"
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/15"
              >
                Close
              </button>
              <button
                type="submit"
                className="min-h-[44px] flex-1 rounded-xl bg-[#7C3AED] text-sm font-semibold text-white"
              >
                Send Request
              </button>
            </div>
          </form>
        </div>
      )}
      {/* GST Tax Invoice Modal */}
      <GstInvoiceModal
        order={invoiceModalOpen ? order : null}
        onClose={() => setInvoiceModalOpen(false)}
      />
    </div>
  );
};
