'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Heart, Package, Trash2, Star, ShoppingCart, Loader2 } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '@/lib/api/products';
import type { WishlistItem } from '@/lib/api/products';
import SellerBadge, { resolveSellerInfo } from '@/components/shared/SellerBadge';
import { useAuthStore } from '@/store/auth-store';

export default function SavedProductsPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const fetchWishlist = async () => {
    try {
      const res = await getWishlist(1, 50);
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'BUYER') fetchWishlist();
    else setLoading(false);
  }, [user]);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      setItems(prev => prev.filter(i => i.productId !== productId));
    } catch {}
  };

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
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Heart className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            {search ? 'No matching products' : 'No saved products'}
          </h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {search ? 'Try a different search term.' : 'Browse products and save the ones you like for quick access.'}
          </p>
          <Link href="/browse">
            <Button className="mt-4">
              <Package className="mr-2 h-4 w-4" />
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const p = item.product;
            if (!p) return null;
            return (
              <Card key={item.id}>
                <CardContent className="p-0">
                  <Link href={`/products/${p.slug}`}>
                    <div className="flex h-32 items-center justify-center bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-10 w-10 text-text-tertiary" />
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${p.slug}`}>
                          <h3 className="text-sm font-semibold text-text-primary hover:text-primary-600 dark:text-dark-text-primary dark:hover:text-primary-400">
                            {p.name}
                          </h3>
                        </Link>
                        <div className="mt-1">
                          <SellerBadge
                            seller={resolveSellerInfo(p)}
                            size="xs"
                            showLocation={false}
                            showStats={false}
                            showLogo={false}
                            linkToProfile={true}
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(item.productId)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {p.categoryName && (
                        <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-secondary dark:bg-dark-surface-secondary dark:text-dark-text-secondary">
                          {p.categoryName}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-current" />
                        {p.rating?.toFixed(1) ?? '0.0'}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 dark:border-dark-border">
                      <p className="text-base font-bold text-text-primary dark:text-dark-text-primary">
                        ₹{p.price?.toLocaleString('en-IN') ?? 'N/A'}
                        <span className="text-xs font-normal text-text-secondary">/{p.unit}</span>
                      </p>
                      <Link href={`/products/${p.slug}`}>
                        <Button size="sm">
                          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}