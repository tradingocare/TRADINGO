'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks';
import { Plus, Package, Edit2 } from 'lucide-react';
import type { Product } from '@/lib/api/types';

export default function SellerProductsPage() {
  const { data, isLoading, error } = useProducts();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Products"
        description="Manage your product listings"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load products. Please try again.</p>
        </div>
      ) : !data?.data?.length ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <Package className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No products yet</h3>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Create your first product to start selling.</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-4">Product</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Stock</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1" />
          </div>
          {data.data.map((product: Product) => (
            <div key={product.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border">
              <div className="flex items-center gap-3 sm:col-span-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{product.name}</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary sm:hidden">{product.category}</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{product.category}</p>
              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary sm:col-span-2">₹{product.price.toLocaleString('en-IN')}</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{product.stock} {product.unit}</p>
              <div className="sm:col-span-1">
                <StatusBadge status={product.status} />
              </div>
              <div className="sm:col-span-1 sm:text-right">
                <Button variant="ghost" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
