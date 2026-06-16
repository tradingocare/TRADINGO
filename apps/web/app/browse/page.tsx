'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api/products';
import ProductCard, { type ProductCardData } from '@/components/product/product-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function BrowsePage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 24;

  useEffect(() => {
    setLoading(true);
    getProducts({ page, limit, search: search || undefined, status: 'active' })
      .then((res: any) => {
        const data = res?.data || res?.products || res || [];
        setProducts(Array.isArray(data) ? data : []);
        setTotal(res?.total || res?.meta?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-surface-secondary pt-24 pb-20 dark:bg-dark-surface-secondary">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-text-primary dark:text-dark-text-primary">Browse Products</h1>
            {!!total && <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{total} products found</p>}
          </div>
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
                <div className="mb-4 aspect-[4/3] rounded-lg bg-surface-secondary dark:bg-dark-surface-secondary" />
                <div className="mb-2 h-4 w-3/4 rounded bg-surface-secondary dark:bg-dark-surface-secondary" />
                <div className="mb-4 h-3 w-1/2 rounded bg-surface-secondary dark:bg-dark-surface-secondary" />
                <div className="mb-2 h-6 w-1/3 rounded bg-surface-secondary dark:bg-dark-surface-secondary" />
                <div className="mb-4 h-3 w-2/3 rounded bg-surface-secondary dark:bg-dark-surface-secondary" />
                <div className="h-10 w-full rounded bg-surface-secondary dark:bg-dark-surface-secondary" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center dark:border-dark-border dark:bg-dark-surface">
            <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">No products found</p>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map(product => (
                <ProductCard key={product._id || (product as any).id} product={product as ProductCardData} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary disabled:opacity-40 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
                >
                  Previous
                </button>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary disabled:opacity-40 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
