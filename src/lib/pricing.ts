import type { Language } from '../i18n/translations.ts';
import type { CartItem, ProductType } from '../types/index.ts';

export const FREE_DELIVERY_THRESHOLD = 599;
export const STANDARD_SHIPPING_FEE = 79;
export const EXPRESS_SHIPPING_FEE = 149;
export const BUNDLE_MIN_QTY = 2;
export const BUNDLE_DISCOUNT_RATE = 0.1;

export interface CartPricingSummary {
  subtotal: number;
  bundleEligibleQty: number;
  bundleEligibleSubtotal: number;
  bundleUnlocked: boolean;
  bundleNeedMore: number;
  bundleDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  shippingFee: number;
  freeDeliveryUnlocked: boolean;
  freeDeliveryRemaining: number;
  freeDeliveryPct: number;
  gstIncluded: number;
  totalAmount: number;
}

export function calculateCartPricing(
  cart: CartItem[],
  deliveryMethod: 'standard' | 'express' = 'standard',
  couponDiscount = 0
): CartPricingSummary {
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  let bundleEligibleQty = 0;
  let bundleEligibleSubtotal = 0;
  for (const item of cart) {
    if (item.productType === 'tshirt' || item.productType === 'mug') {
      bundleEligibleQty += item.quantity;
      bundleEligibleSubtotal += item.unitPrice * item.quantity;
    }
  }

  const bundleUnlocked = bundleEligibleQty >= BUNDLE_MIN_QTY;
  const bundleNeedMore = Math.max(0, BUNDLE_MIN_QTY - bundleEligibleQty);
  const bundleDiscount = bundleUnlocked
    ? Math.round(bundleEligibleSubtotal * BUNDLE_DISCOUNT_RATE)
    : 0;

  const safeCoupon = Math.max(0, Math.min(couponDiscount, Math.max(0, subtotal - bundleDiscount)));
  const totalDiscount = bundleDiscount + safeCoupon;

  const freeDeliveryUnlocked = subtotal >= FREE_DELIVERY_THRESHOLD;
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryPct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  const shippingFee =
    subtotal === 0
      ? 0
      : deliveryMethod === 'express'
        ? EXPRESS_SHIPPING_FEE
        : freeDeliveryUnlocked
          ? 0
          : STANDARD_SHIPPING_FEE;

  const totalAmount = Math.max(0, subtotal + shippingFee - totalDiscount);
  const taxableBase = Math.max(0, subtotal - totalDiscount);
  const gstIncluded = Math.round(taxableBase - taxableBase / 1.18);

  return {
    subtotal,
    bundleEligibleQty,
    bundleEligibleSubtotal,
    bundleUnlocked,
    bundleNeedMore,
    bundleDiscount,
    couponDiscount: safeCoupon,
    totalDiscount,
    shippingFee,
    freeDeliveryUnlocked,
    freeDeliveryRemaining,
    freeDeliveryPct,
    gstIncluded,
    totalAmount,
  };
}

export interface PincodeEstimate {
  pincode: string;
  zoneName: string;
  dispatchDate: string;
  standardRange: string;
  expressDate: string;
  codAvailable: boolean;
}

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
};

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function formatShortDate(date: Date, lang: Language): string {
  try {
    return new Intl.DateTimeFormat(LOCALE_MAP[lang] || 'en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return date.toDateString().slice(0, 10);
  }
}

export function estimatePincodeDelivery(
  rawPincode: string,
  lang: Language = 'en'
): PincodeEstimate | null {
  const clean = rawPincode.replace(/\D/g, '').trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) return null;

  const prefix2 = clean.slice(0, 2);
  const prefix1 = clean.slice(0, 1);

  const metroHubs: Record<string, string> = {
    '60': 'Chennai Metro',
    '56': 'Bengaluru Metro',
    '40': 'Mumbai Metro',
    '11': 'Delhi NCR',
    '50': 'Hyderabad Metro',
    '41': 'Pune Metro',
    '70': 'Kolkata Metro',
    '38': 'Ahmedabad Metro',
  };

  let zoneName = 'India Standard';
  let dispatchDays = 1;
  let stdMin = 3;
  let stdMax = 5;
  let expDays = 2;

  if (metroHubs[prefix2]) {
    zoneName = metroHubs[prefix2];
    dispatchDays = 1;
    stdMin = 2;
    stdMax = 4;
    expDays = 2;
  } else if (prefix1 === '5' || prefix1 === '6') {
    zoneName = 'South India';
    dispatchDays = 1;
    stdMin = 3;
    stdMax = 5;
    expDays = 2;
  } else if (prefix1 === '4' || prefix1 === '3') {
    zoneName = 'West India';
    dispatchDays = 1;
    stdMin = 3;
    stdMax = 5;
    expDays = 2;
  } else if (prefix1 === '1' || prefix1 === '2') {
    zoneName = 'North India';
    dispatchDays = 1;
    stdMin = 4;
    stdMax = 6;
    expDays = 3;
  } else {
    zoneName = 'East & Northeast';
    dispatchDays = 2;
    stdMin = 5;
    stdMax = 7;
    expDays = 3;
  }

  const today = new Date();
  const dispatchDate = formatShortDate(addDays(today, dispatchDays), lang);
  const stdStart = formatShortDate(addDays(today, stdMin), lang);
  const stdEnd = formatShortDate(addDays(today, stdMax), lang);
  const expressDate = formatShortDate(addDays(today, expDays), lang);

  return {
    pincode: clean,
    zoneName,
    dispatchDate,
    standardRange: `${stdStart} – ${stdEnd}`,
    expressDate,
    codAvailable: true,
  };
}

export function getPrintOptionsLabel(productType: ProductType): string {
  switch (productType) {
    case 'tshirt':
      return 'Front & Back Print';
    case 'hoodie':
      return 'Front & Back Print';
    case 'mug':
      return '360° Full Wrap Print';
    case 'cap':
      return 'Front Panel Print';
    default:
      return 'Custom Print';
  }
}
