import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import type { Product } from '../types/index.ts';

export const WishlistPage: React.FC = () => {
  const wishlist = useAppStore((s) => s.wishlist);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Saved Items</h1>
      <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
        Items you liked. Tap Design or Add to Cart whenever you are ready.
      </p>

      {loading ? (
        <div className="mt-8 h-60 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      ) : savedProducts.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-black/10 bg-white p-12 text-center dark:border-white/10 dark:bg-[#16161D]">
          <Heart className="mx-auto h-10 w-10 text-[#FF5A5F]" />
          <h2 className="mt-4 font-display text-xl font-bold">You have no saved items yet.</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Tap the heart icon on any T-shirt or mug to save it here for later.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
