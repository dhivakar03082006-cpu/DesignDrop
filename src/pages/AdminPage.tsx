import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  Download,
  FileDown,
  Plus,
  Trash2,
  Shield,
  TrendingUp,
  Package,
  Tag,
  Users,
  Megaphone,
  Search,
  Eye,
  FileText,
  X,
  Code2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { api } from '../lib/api.ts';
import { downloadOrderInvoicePdf } from '../lib/invoicePdf.ts';
import { GstInvoiceModal } from '../components/GstInvoiceModal.tsx';
import type { Banner, CartItem, Coupon, Order, OrderStatus, Product, UserProfile } from '../types/index.ts';

const STATUS_OPTIONS: OrderStatus[] = [
  'Order Received',
  'Design Checked',
  'Printing Your Item',
  'Packed',
  'On the Way',
  'Out for Delivery',
  'Delivered',
];

export const AdminPage: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const showToast = useAppStore((s) => s.showToast);

  const [tab, setTab] = useState<'analytics' | 'orders' | 'products' | 'coupons' | 'customers'>('analytics');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);

  // Order filters & inspection modals
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'printing' | 'shipped' | 'delivered' | 'issues'>('all');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [inspectItem, setInspectItem] = useState<{ order: Order; item: CartItem } | null>(null);

  // New Product Form
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(599);
  const [prodCategory, setProdCategory] = useState<'T-Shirts' | 'Mugs' | 'Hoodies' | 'Caps'>('T-Shirts');
  const [prodStock, setProdStock] = useState(50);

  // New Coupon Form
  const [coupCode, setCoupCode] = useState('');
  const [coupValue, setCoupValue] = useState(100);
  const [coupType, setCoupType] = useState<'flat' | 'percent'>('flat');

  const loadAll = async () => {
    const [ords, prods, coups, custs, bans] = await Promise.all([
      api.getOrders(),
      api.getProducts(),
      api.getCoupons(),
      api.getAdminCustomers(),
      api.getBanners(),
    ]);
    setOrders(ords);
    setProducts(prods);
    setCoupons(coups);
    setCustomers(custs);
    setBanner(bans[0] || null);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAll().catch(() => {});
    }
  }, [user]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'Cancelled').reduce((acc, o) => acc + o.totalAmount, 0),
    [orders]
  );

  const salesChartData = useMemo(() => {
    const base = [
      { day: 'Mon', sales: 1850 },
      { day: 'Tue', sales: 2490 },
      { day: 'Wed', sales: 3120 },
      { day: 'Thu', sales: 2790 },
      { day: 'Fri', sales: 4180 },
      { day: 'Sat', sales: 5240 },
      { day: 'Today', sales: totalRevenue },
    ];
    return base;
  }, [totalRevenue]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const st of STATUS_OPTIONS) counts[st] = 0;
    for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
    return STATUS_OPTIONS.map((name) => ({
      name: name.split(' ').slice(0, 2).join(' '),
      orders: counts[name] || 0,
    }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (statusFilter === 'pending' && !['Order Received', 'Design Checked'].includes(ord.status)) return false;
      if (statusFilter === 'printing' && !['Printing Your Item', 'Packed'].includes(ord.status)) return false;
      if (statusFilter === 'shipped' && !['On the Way', 'Out for Delivery'].includes(ord.status)) return false;
      if (statusFilter === 'delivered' && ord.status !== 'Delivered') return false;
      if (statusFilter === 'issues' && !['Cancelled', 'Return Requested'].includes(ord.status)) return false;

      if (orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase();
        const hay = `${ord.orderNumber} ${ord.customerName} ${ord.customerPhone} ${ord.shippingAddress.postalCode} ${ord.shippingAddress.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, orderSearch]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#16161D]">
          <Shield className="mx-auto h-10 w-10 text-[#7C3AED]" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Admin Access Only</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please sign in with an Admin account to manage products, orders, and print files.
          </p>
          <button
            type="button"
            onClick={async () => {
              const admin = await api.login('admin@designdrop.in', 'admin123');
              setUser(admin);
              showToast('Signed in as Store Admin.', 'success');
            }}
            className="mt-6 min-h-[48px] w-full rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white hover:bg-[#6D28D9]"
          >
            Sign In as Demo Admin
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (orderNumber: string, status: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderNumber, status);
      setOrders((prev) => prev.map((o) => (o.orderNumber === orderNumber ? updated : o)));
      showToast(`Updated ${orderNumber} to "${status}" (sent live to customer!).`, 'success');
    } catch {
      showToast('Could not update status.', 'error');
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['OrderNumber', 'Customer', 'Email', 'Phone', 'Status', 'Payment', 'TotalINR', 'CreatedAt'],
      ...orders.map((o) => [
        o.orderNumber,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.status,
        o.paymentMethod,
        String(o.totalAmount),
        o.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DesignDrop-Orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const catSlugMap = {
      'T-Shirts': 'tshirts',
      Mugs: 'mugs',
      Hoodies: 'hoodies',
      Caps: 'caps',
    } as const;
    const typeMap = {
      'T-Shirts': 'tshirt',
      Mugs: 'mug',
      Hoodies: 'hoodie',
      Caps: 'cap',
    } as const;
    const created = await api.createProduct({
      name: prodName,
      basePrice: prodPrice,
      category: prodCategory,
      categorySlug: catSlugMap[prodCategory],
      productType: typeMap[prodCategory],
      stock: prodStock,
    });
    setProducts((prev) => [created, ...prev]);
    setProdName('');
    showToast(`Added "${created.name}" to the shop!`, 'success');
  };

  const handleDownloadArtwork = (dataUrl: string | undefined, fileName: string) => {
    if (!dataUrl) {
      showToast('This order item uses the blank store product with no custom overlay.', 'info');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${fileName}.png`;
    a.click();
    showToast('Downloaded print-ready artwork file!', 'success');
  };

  const handleExportDesignSpec = (order: Order, item: CartItem) => {
    const spec = {
      orderNumber: order.orderNumber,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        deliveryPin: order.shippingAddress.postalCode,
      },
      item: {
        productName: item.productName,
        productType: item.productType,
        colorName: item.colorName,
        colorHex: item.colorHex,
        size: item.size,
        printArea: item.printArea,
        quantity: item.quantity,
        unitPriceInclGst: item.unitPrice,
      },
      canvasLayers: item.canvasJson ? safeParseCanvas(item.canvasJson) : null,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.orderNumber}-${item.size}-design-spec.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported custom print spec (JSON)!', 'success');
  };

  const safeParseCanvas = (raw?: string): { objects?: Array<Record<string, unknown>> } | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { objects?: Array<Record<string, unknown>> };
    } catch {
      return null;
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5 dark:border-white/10">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Store Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Update order progress in real time, download print artwork, and manage products.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-black/15 px-4 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          <FileDown className="h-4 w-4" />
          Export Orders to CSV
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: 'analytics', icon: TrendingUp, label: 'Sales & Charts' },
          { id: 'orders', icon: Package, label: `Orders (${orders.length})` },
          { id: 'products', icon: Plus, label: `Products (${products.length})` },
          { id: 'coupons', icon: Tag, label: 'Coupons & Banner' },
          { id: 'customers', icon: Users, label: `Customers (${customers.length})` },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-[#7C3AED] text-white'
                  : 'border border-black/15 bg-white hover:bg-black/5 dark:border-white/15 dark:bg-[#16161D] dark:hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS */}
      {tab === 'analytics' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]">
              <div className="text-xs text-zinc-500">Total Sales</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">Rs {totalRevenue}</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]">
              <div className="text-xs text-zinc-500">Total Orders</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">{orders.length}</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]">
              <div className="text-xs text-zinc-500">Products in Shop</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">{products.length}</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]">
              <div className="text-xs text-zinc-500">Active Coupons</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">{coupons.length}</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
              <h2 className="font-display text-lg font-bold">Weekly Sales (Rs)</h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#7C3AED" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
              <h2 className="font-display text-lg font-bold">Orders by Status</h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#FF5A5F" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER MANAGEMENT */}
      {tab === 'orders' && (
        <div className="mt-6 space-y-4">
          {/* Search + Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#16161D]">
            <div className="relative min-w-[230px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order #, customer, city, or PIN..."
                className="min-h-[42px] w-full rounded-xl border border-black/15 bg-transparent pl-9 pr-3 text-sm dark:border-white/15"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `All (${orders.length})` },
                { id: 'pending', label: 'Pending' },
                { id: 'printing', label: 'Printing' },
                { id: 'shipped', label: 'Shipped' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'issues', label: 'Cancelled / Returns' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setStatusFilter(chip.id as typeof statusFilter)}
                  className={`min-h-[38px] rounded-xl px-3 text-xs font-semibold transition ${
                    statusFilter === chip.id
                      ? 'bg-[#7C3AED] text-white'
                      : 'border border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 && (
            <div className="rounded-2xl border border-black/10 bg-white p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-[#16161D]">
              No matching orders found. Try clearing your search or status filter.
            </div>
          )}

          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-lg font-bold">{ord.orderNumber}</span>
                    <span className="rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                      {ord.status}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {ord.customerName} · {ord.customerPhone}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {ord.shippingAddress.street}, {ord.shippingAddress.city} — PIN{' '}
                    <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                      {ord.shippingAddress.postalCode}
                    </span>{' '}
                    · Total: Rs{' '}
                    <span className="tabular-nums font-semibold">{ord.totalAmount}</span> (18% GST incl. ·{' '}
                    {ord.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'})
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={ord.status}
                    onChange={(e) => handleStatusChange(ord.orderNumber, e.target.value as OrderStatus)}
                    aria-label={`Change status for ${ord.orderNumber}`}
                    className="min-h-[44px] rounded-xl border border-[#7C3AED] bg-transparent px-3 text-sm font-semibold dark:bg-[#16161D]"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(ord)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-3.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/15 dark:text-[#A78BFA]"
                  >
                    <FileText className="h-4 w-4" />
                    GST Invoice
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadOrderInvoicePdf(ord)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-black/15 px-3.5 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </button>
                </div>
              </div>

              {/* Order Items, Design Inspection & Print-Ready Artwork Downloads */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ord.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.designPreviewUrl || item.imageUrl}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 shrink-0 rounded-lg object-cover bg-zinc-100 dark:bg-[#1E1E28]"
                      />
                      <div className="text-xs min-w-0">
                        <div className="truncate font-semibold">{item.productName}</div>
                        <div className="text-zinc-500">
                          {item.size} · {item.colorName} · Print: {item.printArea} × {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectItem({ order: ord, item })}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-black/15 px-2.5 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadArtwork(
                            item.designPreviewUrl,
                            `${ord.orderNumber}-${item.productName.replace(/\s+/g, '-')}`
                          )
                        }
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#7C3AED]/15 px-2.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/25 dark:text-[#A78BFA]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PNG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PRODUCT MANAGEMENT */}
      {tab === 'products' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleCreateProduct}
            className="h-fit space-y-4 rounded-3xl border border-black/10 bg-white p-6 lg:col-span-4 dark:border-white/10 dark:bg-[#16161D]"
          >
            <h2 className="font-display text-lg font-bold">Add a New Product</h2>
            <div>
              <label htmlFor="p-name" className="block text-xs font-semibold">
                Product Name
              </label>
              <input
                id="p-name"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Classic Polo T-Shirt"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="p-price" className="block text-xs font-semibold">
                  Price (Rs, Tax incl.)
                </label>
                <input
                  id="p-price"
                  type="number"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15"
                />
              </div>
              <div>
                <label htmlFor="p-stock" className="block text-xs font-semibold">
                  Stock Count
                </label>
                <input
                  id="p-stock"
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(Number(e.target.value))}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15"
                />
              </div>
            </div>
            <div>
              <label htmlFor="p-cat" className="block text-xs font-semibold">
                Category
              </label>
              <select
                id="p-cat"
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value as typeof prodCategory)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15 dark:bg-[#16161D]"
              >
                <option value="T-Shirts">T-Shirts</option>
                <option value="Mugs">Mugs</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Caps">Caps</option>
              </select>
            </div>
            <button
              type="submit"
              className="min-h-[46px] w-full rounded-xl bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9]"
            >
              Add Product to Shop
            </button>
          </form>

          <div className="space-y-3 lg:col-span-8">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#16161D]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-zinc-500">
                      {p.category} · Rs <span className="tabular-nums">{p.basePrice}</span> · Stock:{' '}
                      <span className="tabular-nums">{p.stock}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await api.updateProduct(p.id, { stock: p.stock + 20 });
                      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
                      showToast(`Added 20 stock to ${p.name}`, 'success');
                    }}
                    className="min-h-[40px] rounded-xl border border-black/15 px-3 text-xs font-semibold dark:border-white/15"
                  >
                    +20 Stock
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.deleteProduct(p.id);
                      setProducts((prev) => prev.filter((x) => x.id !== p.id));
                      showToast(`Removed ${p.name}`, 'info');
                    }}
                    aria-label={`Delete ${p.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COUPONS & BANNER */}
      {tab === 'coupons' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
            <h2 className="font-display text-lg font-bold">Discount Coupons</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!coupCode.trim()) return;
                const created = await api.createCoupon({
                  code: coupCode,
                  discountType: coupType,
                  discountValue: coupValue,
                  minOrder: 499,
                });
                setCoupons((prev) => [...prev, created]);
                setCoupCode('');
                showToast(`Created coupon ${created.code}!`, 'success');
              }}
              className="mt-4 flex flex-wrap gap-2"
            >
              <input
                value={coupCode}
                onChange={(e) => setCoupCode(e.target.value)}
                placeholder="CODE20"
                className="min-h-[44px] flex-1 rounded-xl border border-black/15 bg-transparent px-3 text-sm uppercase dark:border-white/15"
              />
              <select
                value={coupType}
                onChange={(e) => setCoupType(e.target.value as 'flat' | 'percent')}
                className="min-h-[44px] rounded-xl border border-black/15 bg-transparent px-2 text-sm dark:border-white/15 dark:bg-[#16161D]"
              >
                <option value="flat">Rs Off</option>
                <option value="percent">% Off</option>
              </select>
              <input
                type="number"
                value={coupValue}
                onChange={(e) => setCoupValue(Number(e.target.value))}
                className="min-h-[44px] w-20 rounded-xl border border-black/15 bg-transparent px-2 text-sm dark:border-white/15"
              />
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-[#7C3AED] px-4 text-sm font-semibold text-white"
              >
                Add
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10"
                >
                  <div>
                    <span className="font-mono font-bold text-[#7C3AED] dark:text-[#A78BFA]">{c.code}</span>
                    <span className="ml-2 text-xs text-zinc-500">{c.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.deleteCoupon(c.id);
                      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
                    }}
                    aria-label={`Delete coupon ${c.code}`}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {banner && (
            <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Megaphone className="h-5 w-5 text-[#7C3AED]" />
                Top Offer Banner
              </h2>
              <div className="mt-4 space-y-3">
                <input
                  value={banner.title}
                  onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const updated = await api.updateBanner(banner.id, { title: banner.title });
                    setBanner(updated);
                    showToast('Updated home page offer banner!', 'success');
                  }}
                  className="min-h-[44px] rounded-xl bg-[#7C3AED] px-5 text-sm font-semibold text-white"
                >
                  Save Banner Text
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CUSTOMERS */}
      {tab === 'customers' && (
        <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
          <h2 className="font-display text-lg font-bold">Registered Shoppers</h2>
          <div className="mt-4 divide-y divide-black/10 dark:divide-white/10">
            {customers.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-semibold">{c.fullName}</div>
                  <div className="text-xs text-zinc-500">{c.email}</div>
                </div>
                <span className="text-xs font-medium capitalize text-zinc-500">{c.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOM DESIGN INSPECTOR MODAL */}
      {inspectItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Inspect custom design details"
        >
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161D]">
            <div className="flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
              <div>
                <div className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                  Order {inspectItem.order.orderNumber} · Print Production Sheet
                </div>
                <h2 className="font-display text-xl font-extrabold">{inspectItem.item.productName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                aria-label="Close inspector"
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div
                className="flex aspect-square items-center justify-center rounded-2xl border border-black/10 p-4 dark:border-white/10"
                style={{ backgroundColor: inspectItem.item.colorHex || '#18181B' }}
              >
                <img
                  src={inspectItem.item.designPreviewUrl || inspectItem.item.imageUrl}
                  alt={inspectItem.item.productName}
                  className="max-h-full max-w-full rounded-xl object-contain"
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-black/10 bg-zinc-50 p-3.5 dark:border-white/10 dark:bg-[#1E1E28]">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Print Settings
                  </div>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Garment / Base Color</dt>
                      <dd className="flex items-center gap-1.5 font-semibold">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: inspectItem.item.colorHex }}
                        />
                        {inspectItem.item.colorName}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Size</dt>
                      <dd className="font-semibold">{inspectItem.item.size}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Print Area</dt>
                      <dd className="font-semibold capitalize">{inspectItem.item.printArea}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Quantity</dt>
                      <dd className="font-semibold tabular-nums">{inspectItem.item.quantity}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Unit Price (18% GST incl.)</dt>
                      <dd className="font-semibold tabular-nums">Rs {inspectItem.item.unitPrice}</dd>
                    </div>
                  </dl>
                </div>

                {/* Parsed Canvas Layers */}
                <div className="rounded-2xl border border-black/10 bg-zinc-50 p-3.5 dark:border-white/10 dark:bg-[#1E1E28]">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Custom Artwork Elements
                  </div>
                  {(() => {
                    const parsed = safeParseCanvas(inspectItem.item.canvasJson);
                    const objs = parsed?.objects || [];
                    if (objs.length === 0) {
                      return (
                        <p className="mt-1.5 text-xs text-zinc-500">
                          Standard blank item or static artwork overlay (no editable canvas layers).
                        </p>
                      );
                    }
                    return (
                      <ul className="mt-2 space-y-1 text-xs">
                        {objs.map((obj, idx) => (
                          <li key={idx} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 dark:bg-[#16161D]">
                            <span className="font-medium capitalize">{String(obj.type || 'element')}</span>
                            <span className="max-w-[140px] truncate text-zinc-500">
                              {obj.text ? `"${String(obj.text)}"` : String(obj.fill || 'Artwork')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadArtwork(
                        inspectItem.item.designPreviewUrl,
                        `${inspectItem.order.orderNumber}-${inspectItem.item.size}-print`
                      )
                    }
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                  >
                    <Download className="h-4 w-4" />
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportDesignSpec(inspectItem.order, inspectItem.item)}
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/15 px-4 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    <Code2 className="h-4 w-4" />
                    Export Spec JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GST TAX INVOICE MODAL */}
      <GstInvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
};
