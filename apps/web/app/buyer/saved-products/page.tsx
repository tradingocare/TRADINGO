'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search, Heart, Bookmark } from 'lucide-react';
import { getWishlist } from '@/lib/api/products';
import type { WishlistItem } from '@/lib/api/products';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductCard } from '@/components/product/product-card';
import { fromWishlistItem } from '@/components/product/card-converters';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useToast } from '@/components/ui/use-toast';

export default function SavedProductsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { ids: wishIds, fetch: fetchWishlistStore } = useWishlistStore();

  const fetchWishlist = async () => {
    try {
      const res = await getWishlist(1, 50);
      setItems(res.data || []);
    } catch {
      toast({ title: 'Failed to load saved products', variant: 'destructive' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchWishlist();
      fetchWishlistStore();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // When the card bookmark toggles (wishlist store ids change), re-sync the list.
  const idsKey = wishIds.join(',');
  useEffect(() => {
    if (user?.role !== 'BUYER' || !idsKey) return;
    const t = setTimeout(() => {
      fetchWishlist();
      fetchWishlistStore();
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const filtered = items.filter(
    (item) =>
      item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.product?.seller?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Saved Products" description="Products you've bookmarked for future orders" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Saved Products"
        description="Products you've bookmarked for future orders"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          placeholder="Search saved products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        search ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
            <Heart className="h-12 w-12 text-text-tertiary" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">No matching products</h3>
            <p className="mt-1 text-sm text-text-secondary">Try a different search term.</p>
          </div>
        ) : (
          <EmptyState icon={Bookmark} title="No saved products" description="Save products you're interested in" />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ProductCard key={item.id} product={fromWishlistItem(item)} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
