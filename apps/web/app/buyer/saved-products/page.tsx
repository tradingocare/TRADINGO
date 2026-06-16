'use client';

import { useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Heart, Package, Trash2, Star, ShoppingCart } from 'lucide-react';

interface SavedProduct {
  id: string;
  name: string;
  supplier: string;
  price: number;
  unit: string;
  category: string;
  rating: number;
  image?: string;
  savedAt: string;
}

const initialProducts: SavedProduct[] = [
  { id: '1', name: 'Industrial Grade Circuit Board', supplier: 'Precision Electronics', price: 1500, unit: 'pcs', category: 'Electronics', rating: 4.7, savedAt: '2026-06-10' },
  { id: '2', name: 'Organic Cotton Fabric - Premium', supplier: 'Textile World', price: 350, unit: 'meters', category: 'Textiles', rating: 4.8, savedAt: '2026-06-08' },
  { id: '3', name: 'Stainless Steel Fasteners M10', supplier: 'Industrial Solutions Co.', price: 85, unit: 'kg', category: 'Hardware', rating: 4.3, savedAt: '2026-06-05' },
  { id: '4', name: 'Sodium Hydroxide Flakes 99%', supplier: 'ChemiTrade Ltd', price: 220, unit: 'kg', category: 'Chemicals', rating: 4.1, savedAt: '2026-05-28' },
  { id: '5', name: 'Premium Basmati Rice 1121', supplier: 'GreenField Agri Exports', price: 95, unit: 'kg', category: 'Food', rating: 4.5, savedAt: '2026-05-20' },
  { id: '6', name: 'LED Panel Light 24W', supplier: 'Precision Electronics', price: 450, unit: 'pcs', category: 'Electronics', rating: 4.6, savedAt: '2026-05-15' },
];

export default function SavedProductsPage() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRemove = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

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
            No saved products
          </h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {search ? 'Try a different search term.' : 'Browse products and save the ones you like for quick access.'}
          </p>
          <Button className="mt-4">
            <Package className="mr-2 h-4 w-4" />
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-0">
                <div className="flex h-32 items-center justify-center bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
                  <Package className="h-10 w-10 text-text-tertiary" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                        {product.supplier}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(product.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-secondary dark:bg-dark-surface-secondary dark:text-dark-text-secondary">
                      {product.category}
                    </span>
                    <div className="flex items-center gap-0.5 text-xs text-amber-600">
                      <Star className="h-3 w-3 fill-current" />
                      {product.rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 dark:border-dark-border">
                    <p className="text-base font-bold text-text-primary dark:text-dark-text-primary">
                      ₹{product.price.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-text-secondary">/{product.unit}</span>
                    </p>
                    <Button size="sm">
                      <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                      RFQ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
