import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Palette, Package, Trash2, MapPin, Shield, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { api } from '../lib/api.ts';
import { GstInvoiceModal } from '../components/GstInvoiceModal.tsx';
import { DesignDropLogo } from '../components/DesignDropLogo.tsx';
import type { Order, SavedDesign } from '../types/index.ts';

export const AccountPage: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const savedDesigns = useAppStore((s) => s.savedDesigns);
  const deleteDesignLocal = useAppStore((s) => s.deleteDesignLocal);
  const notifications = useAppStore((s) => s.notifications);
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead);
  const showToast = useAppStore((s) => s.showToast);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [serverDesigns, setServerDesigns] = useState<SavedDesign[]>([]);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .getOrders({ userId: user.id, email: user.email })
      .then(setOrders)
      .catch(() => {});
    api
      .getDesigns(user.id)
      .then(setServerDesigns)
      .catch(() => {});
  }, [user]);

  const allDesigns = React.useMemo(() => {
    const map = new Map<string, SavedDesign>();
    for (const d of [...savedDesigns, ...serverDesigns]) {
      if (d.id === 'draft-autosave') continue;
      if (!map.has(d.id)) map.set(d.id, d);
    }
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [savedDesigns, serverDesigns]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const profile =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register({ email, password, fullName, phone });
      setUser(profile);
      showToast(`Welcome back, ${profile.fullName}!`, 'success');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Wrong email or password. Please try again.'
      );
    }
  };

  const handleGoogleDemo = async () => {
    try {
      const profile = await api.googleDemoLogin('priya.sharma@designdrop.in', 'Priya Sharma');
      setUser(profile);
      showToast(`Signed in with Google as ${profile.fullName}!`, 'success');
    } catch {
      showToast('Could not sign in right now. Please try again.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-xl dark:border-white/10 dark:bg-[#16161D]">
          <div className="mb-5">
            <DesignDropLogo size="md" interactive={false} />
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            {mode === 'login' ? 'Sign in to DesignDrop' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Save your custom designs, check past orders, and keep your delivery addresses.
          </p>

          <button
            type="button"
            onClick={handleGoogleDemo}
            className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-black/15 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span>or use email</span>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="acc-name" className="block text-sm font-medium">
                    Full Name
                  </label>
                  <input
                    id="acc-name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15"
                  />
                </div>
                <div>
                  <label htmlFor="acc-phone" className="block text-sm font-medium">
                    Phone Number
                  </label>
                  <input
                    id="acc-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="acc-email" className="block text-sm font-medium">
                Email Address
              </label>
              <input
                id="acc-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@designdrop.in"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15"
              />
            </div>

            <div>
              <label htmlFor="acc-pass" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="acc-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15"
              />
            </div>

            {authError && <p className="text-sm font-medium text-red-500">{authError}</p>}

            <button
              type="submit"
              className="min-h-[48px] w-full rounded-xl bg-[#7C3AED] text-base font-semibold text-white hover:bg-[#6D28D9]"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA]"
            >
              {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </button>
            <button
              type="button"
              onClick={async () => {
                const admin = await api.login('admin@designdrop.in', 'admin123');
                setUser(admin);
                showToast('Signed in as Store Admin.', 'success');
              }}
              className="underline hover:text-[#7C3AED]"
            >
              Quick Admin Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6 dark:border-white/10">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Hi, {user.fullName}</h1>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#7C3AED] px-4 text-sm font-semibold text-white"
            >
              <Shield className="h-4 w-4" />
              Open Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setUser(null);
              showToast('You have signed out.', 'info');
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-black/15 px-4 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Saved Designs */}
        <section className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Palette className="h-5 w-5 text-[#7C3AED]" />
              Your Saved Designs
            </h2>
            <Link to="/studio" className="text-sm font-semibold text-[#7C3AED] hover:underline">
              + New Design
            </Link>
          </div>

          {allDesigns.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-[#16161D]">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You haven&apos;t saved any designs yet. Open the Design Studio to make your first one!
              </p>
              <Link
                to="/studio"
                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-[#7C3AED] px-5 text-sm font-semibold text-white"
              >
                Design Your T-Shirt
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {allDesigns.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#16161D]"
                >
                  <div
                    className="flex h-36 items-center justify-center rounded-xl p-2"
                    style={{ backgroundColor: d.colorHex }}
                  >
                    <img
                      src={d.previewDataUrl}
                      alt={d.title}
                      className="max-h-full object-contain"
                    />
                  </div>
                  <div className="mt-3 font-semibold">{d.title}</div>
                  <div className="text-xs text-zinc-500">
                    {d.productType === 'mug' ? 'Mug' : 'T-Shirt'} · {d.colorName}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/studio?designId=${encodeURIComponent(d.id)}`}
                      className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-[#7C3AED] text-xs font-semibold text-white"
                    >
                      Open in Studio
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        deleteDesignLocal(d.id);
                        setServerDesigns((prev) => prev.filter((x) => x.id !== d.id));
                        api.deleteDesign(d.id).catch(() => {});
                      }}
                      aria-label="Delete saved design"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/15 text-red-500 dark:border-white/15"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order History */}
          <h2 className="mt-10 flex items-center gap-2 font-display text-xl font-bold">
            <Package className="h-5 w-5 text-[#7C3AED]" />
            Order History
          </h2>
          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-500">No orders placed yet.</p>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#16161D]"
                >
                  <div>
                    <div className="font-mono font-bold">{ord.orderNumber}</div>
                    <div className="text-xs text-zinc-500">
                      {new Date(ord.createdAt).toLocaleDateString()} · {ord.status}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold tabular-nums">Rs {ord.totalAmount}</span>
                    <button
                      type="button"
                      onClick={() => setInvoiceOrder(ord)}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-3 text-xs font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/15 dark:text-[#A78BFA]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      GST Invoice
                    </button>
                    <Link
                      to={`/track?id=${encodeURIComponent(ord.orderNumber)}`}
                      className="inline-flex min-h-[40px] items-center rounded-xl border border-black/15 px-3.5 text-xs font-semibold hover:border-[#7C3AED] dark:border-white/15"
                    >
                      Track My Order
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Notifications & Saved Addresses */}
        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Bell className="h-5 w-5 text-[#7C3AED]" />
                Order Updates & Messages
              </h2>
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                Mark all read
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-3.5 text-sm ${
                    n.read
                      ? 'border-black/10 opacity-75 dark:border-white/10'
                      : 'border-[#7C3AED]/40 bg-[#7C3AED]/10'
                  }`}
                >
                  <div className="font-semibold">{n.title}</div>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <MapPin className="h-5 w-5 text-[#7C3AED]" />
              Saved Addresses
            </h2>
            {user.addresses?.length ? (
              <div className="mt-3 space-y-3 text-sm">
                {user.addresses.map((a, idx) => (
                  <div key={idx} className="rounded-xl border border-black/10 p-3 dark:border-white/10">
                    <div className="font-semibold">{a.fullName}</div>
                    <div className="text-xs text-zinc-500">
                      {a.street}, {a.city}, {a.state} — {a.postalCode}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                Your address will be saved automatically after your next order.
              </p>
            )}
          </div>
        </aside>
      </div>

      <GstInvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
};
