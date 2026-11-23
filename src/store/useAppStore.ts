import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TRANSLATIONS, type Language } from '../i18n/translations.ts';
import type {
  AppNotification,
  CartItem,
  SavedDesign,
  ShippingAddress,
  UserProfile,
} from '../types/index.ts';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface FlyToCartPacket {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
}

interface AppState {
  theme: 'dark' | 'light';
  language: Language;
  liteMode: boolean;
  cart: CartItem[];
  wishlist: string[];
  recentlyViewed: string[];
  compareIds: string[];
  compareModalOpen: boolean;
  savedDesigns: SavedDesign[];
  user: UserProfile | null;
  cartDrawerOpen: boolean;
  cartBounceKey: number;
  wishlistPopKey: number;
  flyPackets: FlyToCartPacket[];
  appliedCouponCode: string;
  hasSeenStudioTour: boolean;
  notifications: AppNotification[];
  toasts: ToastMessage[];

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setLiteMode: (lite: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setAppliedCouponCode: (code: string) => void;

  addToCart: (
    item: CartItem,
    origin?: { x: number; y: number },
    options?: { openDrawer?: boolean; silentToast?: boolean }
  ) => void;
  dismissFlyPacket: (id: string) => void;
  updateCartQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  toggleWishlist: (productId: string) => void;
  recordRecentlyViewed: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  setCompareModalOpen: (open: boolean) => void;

  saveDesignLocal: (design: SavedDesign) => void;
  deleteDesignLocal: (id: string) => void;

  setUser: (user: UserProfile | null) => void;
  addSavedAddress: (addr: ShippingAddress) => void;
  setHasSeenStudioTour: (seen: boolean) => void;

  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAllNotificationsRead: () => void;

  showToast: (text: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      liteMode: false,
      cart: [],
      wishlist: ['prod-1', 'prod-3'],
      recentlyViewed: [],
      compareIds: [],
      compareModalOpen: false,
      savedDesigns: [],
      user: null,
      cartDrawerOpen: false,
      cartBounceKey: 0,
      wishlistPopKey: 0,
      flyPackets: [],
      appliedCouponCode: '',
      hasSeenStudioTour: false,
      notifications: [
        {
          id: 'notif-welcome',
          title: 'Welcome to DesignDrop',
          message: 'Use code WELCOME10 for 10% off your first custom order.',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      toasts: [],

      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
          localStorage.setItem('designdrop-theme', theme);
        }
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },
      setLanguage: (language) => set({ language }),
      setLiteMode: (liteMode) => set({ liteMode }),
      setCartDrawerOpen: (cartDrawerOpen) => set({ cartDrawerOpen }),
      setAppliedCouponCode: (code) => set({ appliedCouponCode: code.trim().toUpperCase() }),

      dismissFlyPacket: (id) =>
        set({ flyPackets: get().flyPackets.filter((p) => p.id !== id) }),

      addToCart: (item, origin, options) => {
        const openDrawer = options?.openDrawer ?? true;
        const silentToast = options?.silentToast ?? false;

        const existing = get().cart.find(
          (c) =>
            c.productId === item.productId &&
            c.colorName === item.colorName &&
            c.size === item.size &&
            c.printArea === item.printArea &&
            c.designId === item.designId
        );

        const reduced =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const shouldFly = Boolean(openDrawer && origin && !get().liteMode && !reduced);

        const nextCart = existing
          ? get().cart.map((c) =>
              c.id === existing.id ? { ...c, quantity: c.quantity + item.quantity } : c
            )
          : [item, ...get().cart];

        if (shouldFly && origin) {
          const flyId = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          set({
            cart: nextCart,
            flyPackets: [
              ...get().flyPackets,
              {
                id: flyId,
                imageUrl: item.designPreviewUrl || item.imageUrl,
                startX: origin.x,
                startY: origin.y,
              },
            ],
          });

          // Snap & bounce the cart counter as the flying thumbnail lands
          setTimeout(() => {
            set({
              cartBounceKey: get().cartBounceKey + 1,
              flyPackets: get().flyPackets.filter((p) => p.id !== flyId),
            });
          }, 420);

          // Open the drawer slightly after the snap lands so users feel the arc
          setTimeout(() => {
            set({ cartDrawerOpen: true });
          }, 560);
        } else {
          set({
            cart: nextCart,
            cartBounceKey: get().cartBounceKey + 1,
            cartDrawerOpen: openDrawer ? true : get().cartDrawerOpen,
          });
        }

        if (!silentToast) {
          get().showToast(`Added "${item.productName}" to your cart.`, 'success');
        }
      },

      updateCartQuantity: (id, qty) => {
        if (qty <= 0) {
          get().removeFromCart(id);
          return;
        }
        set({
          cart: get().cart.map((c) => (c.id === id ? { ...c, quantity: qty } : c)),
        });
      },

      removeFromCart: (id) =>
        set({
          cart: get().cart.filter((c) => c.id !== id),
        }),

      clearCart: () => set({ cart: [] }),

      toggleWishlist: (productId) => {
        const exists = get().wishlist.includes(productId);
        set({
          wishlist: exists
            ? get().wishlist.filter((id) => id !== productId)
            : [productId, ...get().wishlist],
          wishlistPopKey: exists ? get().wishlistPopKey : get().wishlistPopKey + 1,
        });
        get().showToast(exists ? 'Removed from saved items.' : 'Saved to your wishlist!', 'info');
      },

      recordRecentlyViewed: (productId) => {
        const current = get().recentlyViewed;
        if (current[0] === productId) return;
        const next = [productId, ...current.filter((id) => id !== productId)].slice(0, 8);
        set({ recentlyViewed: next });
      },

      toggleCompare: (productId) => {
        const current = get().compareIds;
        if (current.includes(productId)) {
          const next = current.filter((id) => id !== productId);
          set({
            compareIds: next,
            compareModalOpen: next.length === 0 ? false : get().compareModalOpen,
          });
          return;
        }
        if (current.length >= 3) {
          get().showToast(TRANSLATIONS[get().language].shopping.compareMaxToast, 'info');
          return;
        }
        set({ compareIds: [...current, productId] });
      },

      clearCompare: () => set({ compareIds: [], compareModalOpen: false }),

      setCompareModalOpen: (compareModalOpen) => set({ compareModalOpen }),

      saveDesignLocal: (design) => {
        const list = get().savedDesigns.filter((d) => d.id !== design.id);
        set({ savedDesigns: [design, ...list] });
      },

      deleteDesignLocal: (id) =>
        set({ savedDesigns: get().savedDesigns.filter((d) => d.id !== id) }),

      setUser: (user) => set({ user }),

      addSavedAddress: (addr) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updated = {
          ...currentUser,
          addresses: [addr, ...(currentUser.addresses || [])],
        };
        set({ user: updated });
      },

      setHasSeenStudioTour: (hasSeenStudioTour) => set({ hasSeenStudioTour }),

      addNotification: (n) =>
        set({
          notifications: [
            {
              ...n,
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...get().notifications,
          ],
        }),

      markAllNotificationsRead: () =>
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
        }),

      showToast: (text, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set({ toasts: [...get().toasts, { id, text, type }] });
        setTimeout(() => {
          get().dismissToast(id);
        }, 4200);
      },

      dismissToast: (id) =>
        set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: 'designdrop-app-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        liteMode: state.liteMode,
        cart: state.cart,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        compareIds: state.compareIds,
        savedDesigns: state.savedDesigns,
        appliedCouponCode: state.appliedCouponCode,
        user: state.user,
        hasSeenStudioTour: state.hasSeenStudioTour,
        notifications: state.notifications,
      }),
    }
  )
);
