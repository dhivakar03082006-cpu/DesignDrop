import type { Banner, Category, Coupon, Order, OrderStatus, Product, Review, SavedDesign, UserProfile } from '../types/index.ts';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Something went wrong. Please try again.');
  }
  return data as T;
}

export const api = {
  getCategories: () => request<Category[]>('/api/categories'),
  getProducts: () => request<Product[]>('/api/products'),
  createProduct: (p: Partial<Product>) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(p) }),
  updateProduct: (id: string, p: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteProduct: (id: string) =>
    request<{ deleted: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),

  getCoupons: () => request<Coupon[]>('/api/coupons'),
  validateCoupon: (code: string, subtotal: number) =>
    request<{ coupon: Coupon; discountAmount: number }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),
  createCoupon: (c: Partial<Coupon>) =>
    request<Coupon>('/api/coupons', { method: 'POST', body: JSON.stringify(c) }),
  deleteCoupon: (id: string) =>
    request<{ deleted: boolean }>(`/api/coupons/${id}`, { method: 'DELETE' }),

  getBanners: () => request<Banner[]>('/api/banners'),
  updateBanner: (id: string, b: Partial<Banner>) =>
    request<Banner>(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(b) }),

  getReviews: (productId?: string) =>
    request<Review[]>(productId ? `/api/reviews?productId=${encodeURIComponent(productId)}` : '/api/reviews'),
  createReview: (r: { productId: string; authorName: string; rating: number; comment: string }) =>
    request<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(r) }),

  getDesigns: (userId?: string) =>
    request<SavedDesign[]>(userId ? `/api/designs?userId=${encodeURIComponent(userId)}` : '/api/designs'),
  getDesignById: (id: string) =>
    request<SavedDesign>(`/api/designs/${encodeURIComponent(id)}`),
  saveDesign: (d: SavedDesign) =>
    request<SavedDesign>('/api/designs', { method: 'POST', body: JSON.stringify(d) }),
  deleteDesign: (id: string) =>
    request<{ deleted: boolean }>(`/api/designs/${id}`, { method: 'DELETE' }),
  subscribeWelcomePerk: (email: string) =>
    request<{ ok: boolean; email: string; code: string; message: string }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getOrders: (params?: { userId?: string; email?: string }) => {
    const q = new URLSearchParams();
    if (params?.userId) q.set('userId', params.userId);
    if (params?.email) q.set('email', params.email);
    const qs = q.toString();
    return request<Order[]>(qs ? `/api/orders?${qs}` : '/api/orders');
  },
  getOrderByNumber: (orderNumber: string) =>
    request<Order>(`/api/orders/${encodeURIComponent(orderNumber)}`),
  createOrder: (payload: Partial<Order>) =>
    request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  updateOrderStatus: (orderNumber: string, status: OrderStatus, note?: string) =>
    request<Order>(`/api/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  cancelOrder: (orderNumber: string, reason?: string) =>
    request<Order>(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  requestReturn: (orderNumber: string, reason?: string) =>
    request<Order>(`/api/orders/${encodeURIComponent(orderNumber)}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  createRazorpayTestPayment: (amount: number) =>
    request<{ testOrderId: string; paymentId: string; amount: number; currency: string; status: string }>(
      '/api/payments/razorpay-test',
      { method: 'POST', body: JSON.stringify({ amount }) }
    ),

  login: (email: string, password: string) =>
    request<UserProfile>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: { email: string; password: string; fullName: string; phone?: string }) =>
    request<UserProfile>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  googleDemoLogin: (email?: string, fullName?: string) =>
    request<UserProfile>('/api/auth/google-demo', {
      method: 'POST',
      body: JSON.stringify({ email, fullName }),
    }),
  getAdminCustomers: () => request<UserProfile[]>('/api/admin/customers'),
};
