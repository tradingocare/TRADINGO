'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { type ProductDetailVariant } from '@/types/product-detail';

interface VariantSelectorProps {
  variants: ProductDetailVariant[];
  onSelect: (variant: ProductDetailVariant) => void;
  selectedVariant?: ProductDetailVariant | null;
}

export function VariantSelector({
  variants,
  onSelect,
  selectedVariant,
}: VariantSelectorProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, ProductDetailVariant[]>();
    for (const v of variants) {
      if (!v.isActive) continue;
      const list = map.get(v.variantType) || [];
      list.push(v);
      map.set(v.variantType, list);
    }
    return map;
  }, [variants]);

  if (variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([type, items]) => (
        <div key={type}>
          <p className="mb-2 text-sm font-medium text-text-primary dark:text-dark-text-primary">
            {type}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(v)}
                  className={cn(
                    'relative rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10 text-primary-700 shadow-sm dark:border-primary-400 dark:text-primary-300'
                      : 'border-border bg-surface text-text-secondary hover:border-primary-300 hover:text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary dark:hover:border-primary-600',
                  )}
                >
                  {v.value}
                  {isSelected && (
                    <CheckCircle className="ml-1.5 inline-block h-3.5 w-3.5 text-primary-500 dark:text-primary-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="rounded-lg bg-surface-secondary/50 p-3 dark:bg-dark-surface-secondary/50">
          {selectedVariant.sku && (
            <p className="text-xs text-text-tertiary dark:text-dark-text-tertiary">
              SKU: {selectedVariant.sku}
            </p>
          )}
          {selectedVariant.price != null && (
            <p className="text-lg font-bold text-text-primary dark:text-dark-text-primary">
              ₹{selectedVariant.price.toLocaleString()}
              {selectedVariant.compareAtPrice && (
                <span className="ml-2 text-sm text-text-tertiary line-through dark:text-dark-text-tertiary">
                  ₹{selectedVariant.compareAtPrice.toLocaleString()}
                </span>
              )}
            </p>
          )}
          {selectedVariant.stockStatus && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                selectedVariant.stockStatus === 'IN_STOCK'
                  ? 'text-accent-600 dark:text-accent-400'
                  : selectedVariant.stockStatus === 'LOW_STOCK'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400',
              )}
            >
              {selectedVariant.stockStatus === 'IN_STOCK'
                ? 'In Stock'
                : selectedVariant.stockStatus === 'LOW_STOCK'
                  ? 'Low Stock'
                  : 'Out of Stock'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
