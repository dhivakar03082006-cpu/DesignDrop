import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getStore, saveStore } from './server/store.ts';
import {
  fetchDesignsFromSupabase,
  fetchOrdersFromSupabase,
  isServerSupabaseConfigured,
  syncDesignToSupabase,
  syncOrderStatusToSupabase,
  syncOrderToSupabase,
} from './server/supabaseAdapter.ts';
import type { Order, OrderStatus, Product, Review, SavedDesign } from './src/types/index.ts';

const PORT = 3000;

type SSEClient = {
  id: string;
  res: express.Response;
};

const sseClients: SSEClient[] = [];

function broadcastEvent(event: string, payload: unknown) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(data);
    } catch {
      // Ignore closed streams
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Initialize store on boot & hydrate from Supabase if configured
  const bootStore = getStore();
  if (isServerSupabaseConfigured) {
    Promise.all([fetchOrdersFromSupabase(), fetchDesignsFromSupabase()])
      .then(([remoteOrders, remoteDesigns]) => {
        let changed = false;
        if (remoteOrders && remoteOrders.length > 0) {
          const existingNums = new Set(bootStore.orders.map((o) => o.orderNumber.toUpperCase()));
          for (const ro of remoteOrders) {
            if (!existingNums.has(ro.orderNumber.toUpperCase())) {
              bootStore.orders.push(ro);
              changed = true;
            }
          }
          bootStore.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        if (remoteDesigns && remoteDesigns.length > 0) {
          const existingIds = new Set(bootStore.designs.map((d) => d.id));
          for (const rd of remoteDesigns) {
            if (!existingIds.has(rd.id)) {
              bootStore.designs.push(rd);
              changed = true;
            }
          }
        }
        if (changed) saveStore(bootStore);
      })
      .catch(() => {
        // Fallback silently to local persistence
      });
  }

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      persistence: isServerSupabaseConfigured ? 'supabase+local' : 'local',
      time: new Date().toISOString(),
    });
  });

  // First Order Perk (WELCOME10) signup
  app.post('/api/newsletter', (req, res) => {
    const { email } = req.body as { email?: string };
    const clean = (email || '').trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    res.json({
      ok: true,
      email: clean,
      code: 'WELCOME10',
      message: 'Your 10% off code WELCOME10 is unlocked and ready to use!',
    });
  });

  // Real-time SSE stream for order status updates
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sseClients.push({ id, res });
    res.write(`event: connected\ndata: ${JSON.stringify({ id })}\n\n`);

    req.on('close', () => {
      const idx = sseClients.findIndex((c) => c.id === id);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // Categories
  app.get('/api/categories', (_req, res) => {
    const store = getStore();
    res.json(store.categories);
  });

  // Products
  app.get('/api/products', (_req, res) => {
    const store = getStore();
    res.json(store.products);
  });

  app.post('/api/products', (req, res) => {
    const store = getStore();
    const body = req.body as Partial<Product>;
    if (!body.name || !body.basePrice) {
      res.status(400).json({ error: 'Please enter a product name and price.' });
      return;
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: (body.name || 'custom-item').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: body.name,
      shortDescription: body.shortDescription || 'Custom printed item made to order.',
      basePrice: Number(body.basePrice),
      material: body.material || '100% Cotton',
      category: body.category || 'T-Shirts',
      categorySlug: body.categorySlug || 'tshirts',
      productType: body.productType || 'tshirt',
      isCustomizable: body.isCustomizable ?? true,
      imageUrl: body.imageUrl || '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg',
      rating: 4.8,
      reviewCount: 0,
      stock: Number(body.stock ?? 50),
      trending: Boolean(body.trending),
      colors: body.colors || [
        { name: 'Charcoal Black', hex: '#18181B' },
        { name: 'Warm Ivory', hex: '#F5F3EE' },
      ],
      sizes: body.sizes || ['S', 'M', 'L', 'XL'],
    };
    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'We could not find that product.' });
      return;
    }
    store.products[idx] = { ...store.products[idx], ...req.body };
    saveStore(store);
    res.json(store.products[idx]);
  });

  app.delete('/api/products/:id', (req, res) => {
    const store = getStore();
    store.products = store.products.filter((p) => p.id !== req.params.id);
    saveStore(store);
    res.json({ deleted: true });
  });

  // Coupons
  app.get('/api/coupons', (_req, res) => {
    const store = getStore();
    res.json(store.coupons);
  });

  app.post('/api/coupons/validate', (req, res) => {
    const { code, subtotal } = req.body as { code?: string; subtotal?: number };
    const clean = (code || '').trim().toUpperCase();
    const store = getStore();
    const coupon = store.coupons.find((c) => c.code === clean && c.active);
    if (!coupon) {
      res.status(404).json({ error: 'That coupon code was not found. Please check the spelling and try again.' });
      return;
    }
    const sub = Number(subtotal || 0);
    if (sub < coupon.minOrder) {
      res.status(400).json({
        error: `Add Rs ${coupon.minOrder - sub} more to use ${coupon.code}.`,
      });
      return;
    }
    const discountAmount =
      coupon.discountType === 'percent'
        ? Math.round((sub * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, sub);
    res.json({ coupon, discountAmount });
  });

  app.post('/api/coupons', (req, res) => {
    const store = getStore();
    const { code, discountType, discountValue, minOrder, description } = req.body;
    if (!code || !discountValue) {
      res.status(400).json({ error: 'Please enter a code and discount amount.' });
      return;
    }
    const created = {
      id: `coup-${Date.now()}`,
      code: String(code).trim().toUpperCase(),
      discountType: discountType === 'percent' ? 'percent' : 'flat',
      discountValue: Number(discountValue),
      minOrder: Number(minOrder || 0),
      description: description || 'Special discount code',
      active: true,
    } as const;
    store.coupons.push(created);
    saveStore(store);
    res.status(201).json(created);
  });

  app.delete('/api/coupons/:id', (req, res) => {
    const store = getStore();
    store.coupons = store.coupons.filter((c) => c.id !== req.params.id);
    saveStore(store);
    res.json({ deleted: true });
  });

  // Banners
  app.get('/api/banners', (_req, res) => {
    const store = getStore();
    res.json(store.banners);
  });

  app.put('/api/banners/:id', (req, res) => {
    const store = getStore();
    const idx = store.banners.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Banner not found.' });
      return;
    }
    store.banners[idx] = { ...store.banners[idx], ...req.body };
    saveStore(store);
    res.json(store.banners[idx]);
  });

  // Reviews
  app.get('/api/reviews', (req, res) => {
    const store = getStore();
    const productId = req.query.productId as string | undefined;
    const list = productId
      ? store.reviews.filter((r) => r.productId === productId)
      : store.reviews;
    res.json(list);
  });

  app.post('/api/reviews', (req, res) => {
    const store = getStore();
    const { productId, authorName, rating, comment } = req.body;
    if (!productId || !authorName || !comment) {
      res.status(400).json({ error: 'Please write your name and review before saving.' });
      return;
    }
    const review: Review = {
      id: `rev-${Date.now()}`,
      productId,
      authorName,
      rating: Math.max(1, Math.min(5, Number(rating || 5))),
      comment,
      createdAt: new Date().toISOString(),
    };
    store.reviews.unshift(review);
    const prod = store.products.find((p) => p.id === productId);
    if (prod) {
      const prodReviews = store.reviews.filter((r) => r.productId === productId);
      const avg = prodReviews.reduce((acc, r) => acc + r.rating, 0) / prodReviews.length;
      prod.reviewCount = prodReviews.length;
      prod.rating = Number(avg.toFixed(1));
    }
    saveStore(store);
    res.status(201).json(review);
  });

  // Designs
  app.get('/api/designs', async (req, res) => {
    const store = getStore();
    if (isServerSupabaseConfigured) {
      const remote = await fetchDesignsFromSupabase();
      if (remote && remote.length > 0) {
        const localIds = new Set(store.designs.map((d) => d.id));
        let added = false;
        for (const rd of remote) {
          if (!localIds.has(rd.id)) {
            store.designs.push(rd);
            added = true;
          }
        }
        if (added) saveStore(store);
      }
    }
    const userId = req.query.userId as string | undefined;
    const list = userId
      ? store.designs.filter((d) => d.userId === userId)
      : store.designs;
    res.json(list);
  });

  app.get('/api/designs/:id', async (req, res) => {
    const store = getStore();
    let found = store.designs.find((d) => d.id === req.params.id);
    if (!found && isServerSupabaseConfigured) {
      const remote = await fetchDesignsFromSupabase();
      if (remote) {
        found = remote.find((d) => d.id === req.params.id);
        if (found) {
          store.designs.unshift(found);
          saveStore(store);
        }
      }
    }
    if (!found) {
      res.status(404).json({ error: 'Saved design not found.' });
      return;
    }
    res.json(found);
  });

  app.post('/api/designs', async (req, res) => {
    const store = getStore();
    const body = req.body as SavedDesign;
    const existingIdx = store.designs.findIndex((d) => d.id === body.id);
    const saved: SavedDesign = {
      ...body,
      id: body.id || `des-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      store.designs[existingIdx] = saved;
    } else {
      store.designs.unshift(saved);
    }
    saveStore(store);
    if (isServerSupabaseConfigured) {
      await syncDesignToSupabase(saved);
    }
    res.status(201).json(saved);
  });

  app.delete('/api/designs/:id', (req, res) => {
    const store = getStore();
    store.designs = store.designs.filter((d) => d.id !== req.params.id);
    saveStore(store);
    res.json({ deleted: true });
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    const store = getStore();
    if (isServerSupabaseConfigured) {
      const remote = await fetchOrdersFromSupabase();
      if (remote && remote.length > 0) {
        const localNums = new Set(store.orders.map((o) => o.orderNumber.toUpperCase()));
        let added = false;
        for (const ro of remote) {
          if (!localNums.has(ro.orderNumber.toUpperCase())) {
            store.orders.push(ro);
            added = true;
          }
        }
        if (added) {
          store.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          saveStore(store);
        }
      }
    }
    const userId = req.query.userId as string | undefined;
    const email = req.query.email as string | undefined;
    let orders = store.orders;
    if (userId) {
      orders = orders.filter((o) => o.userId === userId || o.customerEmail === email);
    }
    res.json(orders);
  });

  app.get('/api/orders/:orderNumber', async (req, res) => {
    const store = getStore();
    const clean = req.params.orderNumber.trim().toUpperCase();
    let order = store.orders.find((o) => o.orderNumber.toUpperCase() === clean);
    if (!order && isServerSupabaseConfigured) {
      const remote = await fetchOrdersFromSupabase();
      if (remote) {
        order = remote.find((o) => o.orderNumber.toUpperCase() === clean);
        if (order) {
          store.orders.unshift(order);
          saveStore(store);
        }
      }
    }
    if (!order) {
      res.status(404).json({
        error: `We couldn't find order "${clean}". Please check the order number on your receipt and try again.`,
      });
      return;
    }
    res.json(order);
  });

  app.post('/api/orders', async (req, res) => {
    const store = getStore();
    const payload = req.body as Partial<Order>;
    if (!payload.items?.length || !payload.shippingAddress) {
      res.status(400).json({ error: 'Please add items and your delivery address before placing your order.' });
      return;
    }
    const orderNum = `DD-${Math.floor(1050 + Math.random() * 8900)}`;
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      userId: payload.userId,
      customerName: payload.shippingAddress.fullName,
      customerEmail: payload.shippingAddress.email,
      customerPhone: payload.shippingAddress.phone,
      shippingAddress: payload.shippingAddress,
      deliveryMethod: payload.deliveryMethod || 'standard',
      paymentMethod: payload.paymentMethod || 'cod',
      paymentStatus: payload.paymentMethod === 'razorpay_test' ? 'paid' : 'pending',
      paymentRef: payload.paymentRef,
      status: 'Order Received',
      subtotal: Number(payload.subtotal || 0),
      gstAmount: Number(payload.gstAmount || 0),
      shippingFee: Number(payload.shippingFee || 0),
      discountAmount: Number(payload.discountAmount || 0),
      totalAmount: Number(payload.totalAmount || 0),
      couponCode: payload.couponCode,
      items: payload.items,
      tracking: [
        {
          status: 'Order Received',
          timestamp: now,
          note: 'We got your order and sent a receipt to your email.',
        },
      ],
      createdAt: now,
    };
    store.orders.unshift(newOrder);
    saveStore(store);
    if (isServerSupabaseConfigured) {
      await syncOrderToSupabase(newOrder);
    }
    broadcastEvent('order_created', newOrder);
    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:orderNumber/status', async (req, res) => {
    const store = getStore();
    const { status, note } = req.body as { status: OrderStatus; note?: string };
    const order = store.orders.find(
      (o) => o.orderNumber.toUpperCase() === req.params.orderNumber.toUpperCase()
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const statusNote = note || `Order moved to ${status}.`;
    order.status = status;
    order.tracking.push({
      status,
      timestamp: new Date().toISOString(),
      note: statusNote,
    });
    if (status === 'Delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }
    saveStore(store);
    if (isServerSupabaseConfigured) {
      await syncOrderStatusToSupabase(order.orderNumber, status, statusNote, {
        paymentStatus: order.paymentStatus,
      });
    }
    broadcastEvent('order_updated', order);
    res.json(order);
  });

  app.post('/api/orders/:orderNumber/cancel', async (req, res) => {
    const store = getStore();
    const order = store.orders.find(
      (o) => o.orderNumber.toUpperCase() === req.params.orderNumber.toUpperCase()
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (!['Order Received', 'Design Checked'].includes(order.status)) {
      res.status(400).json({
        error: 'Printing has already started, so this order cannot be cancelled now. You can request a return after delivery.',
      });
      return;
    }
    const cancelNote = 'Your order was cancelled. Any paid amount will be refunded in 3-5 days.';
    order.status = 'Cancelled';
    order.cancelReason = req.body?.reason || 'Cancelled by customer';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }
    order.tracking.push({
      status: 'Cancelled',
      timestamp: new Date().toISOString(),
      note: cancelNote,
    });
    saveStore(store);
    if (isServerSupabaseConfigured) {
      await syncOrderStatusToSupabase(order.orderNumber, 'Cancelled', cancelNote, {
        paymentStatus: order.paymentStatus,
        cancelReason: order.cancelReason,
      });
    }
    broadcastEvent('order_updated', order);
    res.json(order);
  });

  app.post('/api/orders/:orderNumber/return', async (req, res) => {
    const store = getStore();
    const order = store.orders.find(
      (o) => o.orderNumber.toUpperCase() === req.params.orderNumber.toUpperCase()
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    order.status = 'Return Requested';
    order.returnReason = req.body?.reason || 'Size or print issue';
    const returnNote = `We got your return request (${order.returnReason}). Our team will reach out within 24 hours.`;
    order.tracking.push({
      status: 'Return Requested',
      timestamp: new Date().toISOString(),
      note: returnNote,
    });
    saveStore(store);
    if (isServerSupabaseConfigured) {
      await syncOrderStatusToSupabase(order.orderNumber, 'Return Requested', returnNote, {
        returnReason: order.returnReason,
      });
    }
    broadcastEvent('order_updated', order);
    res.json(order);
  });

  // Razorpay Test Mode endpoint
  app.post('/api/payments/razorpay-test', (req, res) => {
    const { amount } = req.body as { amount: number };
    res.json({
      testOrderId: `order_test_${Date.now()}`,
      paymentId: `pay_test_${Math.random().toString(36).slice(2, 10)}`,
      amount: Math.round(Number(amount || 0) * 100),
      currency: 'INR',
      status: 'captured',
    });
  });

  // Auth endpoints
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const store = getStore();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === (email || '').trim().toLowerCase() && u.password === password
    );
    if (!user) {
      res.status(401).json({ error: 'Wrong email or password. Please try again.' });
      return;
    }
    const { password: _p, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, fullName, phone } = req.body as {
      email?: string;
      password?: string;
      fullName?: string;
      phone?: string;
    };
    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Please fill in your name, email, and password.' });
      return;
    }
    const store = getStore();
    if (store.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
      return;
    }
    const newUser = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password,
      fullName,
      phone: phone || '',
      role: 'customer' as const,
      addresses: [],
    };
    store.users.push(newUser);
    saveStore(store);
    const { password: _p, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  });

  app.post('/api/auth/google-demo', (req, res) => {
    const { email, fullName } = req.body as { email?: string; fullName?: string };
    const store = getStore();
    const targetEmail = (email || 'google.shopper@designdrop.in').toLowerCase();
    let user = store.users.find((u) => u.email === targetEmail);
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        email: targetEmail,
        fullName: fullName || 'Priya Sharma',
        phone: '9876501234',
        role: 'customer',
        addresses: [],
      };
      store.users.push(user);
      saveStore(store);
    }
    const { password: _p, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get('/api/admin/customers', (_req, res) => {
    const store = getStore();
    const list = store.users.map(({ password: _p, ...u }) => u);
    res.json(list);
  });

  // Vite or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });

    // HMR is intentionally disabled in this environment; serve a zero-WebSocket
    // /@vite/client runtime so CSS injection & module helpers work without WS errors.
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(`
const sheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    document.head.appendChild(style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (!url || (url[0] !== "." && url[0] !== "/")) return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (search ? "&" + search.slice(1) : "") + (hash || "");
}
export class ErrorOverlay extends HTMLElement {
  constructor() { super(); }
}
`);
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DesignDrop server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
