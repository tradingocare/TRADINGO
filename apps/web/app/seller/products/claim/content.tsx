'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { Search, Package, Loader2 } from 'lucide-react';

interface ProductMasterCategory {
  id: string;
  name: string;
}

interface ProductMaster {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  unit?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  currency: string;
  category?: ProductMasterCategory;
}

interface SearchResponse {
  data: ProductMaster[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function ClaimProductContent() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<SearchResponse>(`/products/masters/search?q=${encodeURIComponent(query)}&limit=20`);
        setResults(res.data);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Claim a Product"
        description="Search the product catalog and claim a product listing"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          className="pl-10"
          placeholder="Search for a product by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : searched && results.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <Package className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No products found</h3>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Try a different search term.</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-dark-surface dark:border-dark-border"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                {product.name}
              </h3>
              {product.category && (
                <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                  {product.category.name}
                </p>
              )}
              <p className="mt-2 line-clamp-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                {product.shortDescription || product.description || 'No description'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-text-tertiary dark:text-dark-text-tertiary">
                  Unit: {product.unit || '—'}
                </span>
                {(product.priceRangeMin != null || product.priceRangeMax != null) && (
                  <span className="text-xs font-medium text-text-primary dark:text-dark-text-primary">
                    {product.currency || 'INR'} {product.priceRangeMin?.toLocaleString('en-IN') ?? '—'} – {product.priceRangeMax?.toLocaleString('en-IN') ?? '—'}
                  </span>
                )}
              </div>
              <Button
                className="mt-4 w-full"
                size="sm"
                onClick={() => router.push(`/seller/product-claims/new?productMasterId=${product.id}`)}
              >
                Claim
              </Button>
            </div>
          ))}
        </div>
      ) : searched === false && !query.trim() ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <Search className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">Search products</h3>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            Type a product name to search the catalog.
          </p>
        </div>
      ) : null}
    </div>
  );
}
