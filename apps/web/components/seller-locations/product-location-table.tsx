'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ExternalLink, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { LocationStatusBadge } from './location-status-badge';
import type { ProductWithLocation } from '@/lib/api/product-locations';

interface ProductLocationTableProps {
  products: ProductWithLocation[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilterLocationStatus: (status: 'set' | 'missing' | undefined) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
}

export function ProductLocationTable({
  products,
  total,
  page,
  totalPages,
  onPageChange,
  onSearch,
  onFilterLocationStatus,
  selectedIds,
  onSelectionChange,
  loading,
}: ProductLocationTableProps) {
  const [searchInput, setSearchInput] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'set' | 'missing'>('all');

  const handleSearch = () => {
    onSearch(searchInput);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleLocationFilterChange = (val: 'all' | 'set' | 'missing') => {
    setLocationFilter(val);
    onFilterLocationStatus(val === 'all' ? undefined : val);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-secondary dark:bg-dark-surface-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="h-12 w-12 text-text-tertiary dark:text-dark-text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-1">
          No products found
        </h3>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-6 max-w-md">
          {searchInput
            ? 'Try a different search term or clear filters.'
            : 'You haven\'t added any products yet. Create a product to set its location.'}
        </p>
        {!searchInput && (
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary dark:bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Add Product
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, SKU..."
            className="w-full rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface pl-9 pr-3 py-2 text-sm text-text-primary dark:text-dark-text-primary placeholder:text-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-dark-text-tertiary hover:text-text-primary dark:hover:text-dark-text-primary"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          {(['all', 'set', 'missing'] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleLocationFilterChange(val)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                locationFilter === val
                  ? 'bg-primary/10 text-primary dark:bg-primary-dark/10 dark:text-primary-dark border border-primary/30 dark:border-primary-dark/30'
                  : 'bg-surface dark:bg-dark-surface text-text-secondary dark:text-dark-text-secondary border border-surface-border dark:border-dark-border hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary'
              }`}
            >
              {val === 'all' ? 'All' : val === 'set' ? 'Set' : 'Missing'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-surface-border dark:border-dark-border">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-secondary dark:bg-dark-surface-secondary text-xs font-medium text-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-surface-border dark:border-dark-border"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <span className="inline-flex items-center gap-1">
                  Product <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">SKU</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Coordinates</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-dark-border">
            {products.map((product) => (
              <tr
                key={product.id}
                className="bg-surface dark:bg-dark-surface hover:bg-surface-secondary/50 dark:hover:bg-dark-surface-secondary/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="rounded border-surface-border dark:border-dark-border"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/seller/products/${product.id}/location`}
                    className="text-sm font-medium text-primary dark:text-primary-dark hover:underline"
                  >
                    {product.name}
                  </Link>
                  <div className="text-xs text-text-tertiary dark:text-dark-text-tertiary mt-0.5">
                    {product.slug}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary hidden sm:table-cell">
                  {product.sku || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary hidden md:table-cell">
                  {product.category?.name || '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <LocationStatusBadge
                    locationSet={product.locationSet}
                    indexed={product.indexedAt !== null}
                  />
                </td>
                <td className="px-4 py-3 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
                  {product.locationSet ? (
                    <span className="font-mono text-xs">
                      {product.latitude?.toFixed(4)}, {product.longitude?.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-text-tertiary dark:text-dark-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/seller/products/${product.id}/location`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary dark:text-primary-dark hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-text-secondary dark:text-dark-text-secondary">
        <span>
          Showing {products.length} of {total} products
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-lg p-1.5 hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg p-1.5 hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
