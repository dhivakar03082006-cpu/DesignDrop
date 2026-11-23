export type ProductType = 'tshirt' | 'mug' | 'hoodie' | 'cap';

export type OrderStatus =
  | 'Order Received'
  | 'Design Checked'
  | 'Printing Your Item'
  | 'Packed'
  | 'On the Way'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  basePrice: number;
  material: string;
  category: 'T-Shirts' | 'Mugs' | 'Hoodies' | 'Caps';
  categorySlug: 'tshirts' | 'mugs' | 'hoodies' | 'caps';
  productType: ProductType;
  isCustomizable: boolean;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  stock: number;
  trending: boolean;
  colors: ProductColor[];
  sizes: string[];
}

export interface Category {
  id: string;
  slug: 'tshirts' | 'mugs' | 'hoodies' | 'caps';
  name: string;
  description: string;
  imageUrl: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrder: number;
  description: string;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SavedDesign {
  id: string;
  userId?: string;
  title: string;
  productId: string;
  productType: 'tshirt' | 'mug';
  colorName: string;
  colorHex: string;
  printArea: 'front' | 'back' | 'wrap';
  canvasJson: string;
  previewDataUrl: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productType: ProductType;
  imageUrl: string;
  colorName: string;
  colorHex: string;
  size: string;
  printArea: 'front' | 'back' | 'wrap' | 'none';
  quantity: number;
  unitPrice: number;
  designId?: string;
  designPreviewUrl?: string;
  canvasJson?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface OrderTrackingStep {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  deliveryMethod: 'standard' | 'express';
  paymentMethod: 'razorpay_test' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentRef?: string;
  status: OrderStatus;
  subtotal: number;
  gstAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  items: CartItem[];
  tracking: OrderTrackingStep[];
  cancelReason?: string;
  returnReason?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses: ShippingAddress[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  active: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
  read: boolean;
  createdAt: string;
}
