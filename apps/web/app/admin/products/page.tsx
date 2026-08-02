'use client'

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Package, Search, Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  INACTIVE: 'bg-red-500/10 text-red-400',
  DRAFT: 'bg-surface-secondary text-white/40',
};

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'products', search],
    queryFn: () => apiClient.get('/products/admin/all', { params: { search: search || undefined, limit: 50 } }).then(r => r.data),
  });

  const products = data?.data || [];

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Products" description="Manage all product listings across the platform." />

        <div className="mt-8 rounded-3xl p-6 bg-surface" style={{ backdropFilter: 'blur(24px)', border: '1px solid var(--border-color)' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full surface-card-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 backdrop-blur-md focus:border-[#f59e0b]/30 focus:outline-none" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="default" /></div>
        ) : error ? (
          <div className="rounded-3xl p-12 text-center text-sm text-white/40 bg-surface" style={{ backdropFilter: 'blur(24px)', border: '1px solid var(--border-color)' }}>
            Failed to load products.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl p-12 text-center text-sm text-white/40 bg-surface" style={{ backdropFilter: 'blur(24px)', border: '1px solid var(--border-color)' }}>
            No products found.
          </div>
        ) : (
          <div className="mt-4 rounded-3xl overflow-hidden bg-surface" style={{ backdropFilter: 'blur(24px)', border: '1px solid var(--border-color)' }}>
            <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-white/40 sm:grid">
              <div className="col-span-3">Product</div>
              <div className="col-span-2">Seller</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Price</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2" />
            </div>
            {products.map((product: any) => (
              <div key={product.id}
                className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center">
                <div className="flex items-center gap-3 sm:col-span-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent-500">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{product.name}</p>
                    <p className="text-xs text-white/40 sm:hidden">{product.id}</p>
                  </div>
                </div>
                <p className="text-sm text-white/60 sm:col-span-2">{product.company?.name || 'N/A'}</p>
                <p className="text-sm text-white/60 sm:col-span-2">{product.category?.name || product.productType || '-'}</p>
                <p className="text-sm font-medium text-white sm:col-span-1">?{Number(product.basePrice || 0).toLocaleString('en-IN')}</p>
                <p className="text-sm text-white/60 sm:col-span-1">{product.stock ?? '-'}</p>
                <div className="sm:col-span-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[product.status] || 'bg-surface-secondary text-white/40'}`}>
                    {product.status?.toLowerCase() || 'unknown'}
                  </span>
                </div>
                <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                  <button className="rounded-lg border border-border bg-surface p-1.5 text-white/40 transition-colors hover:text-accent-500">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
