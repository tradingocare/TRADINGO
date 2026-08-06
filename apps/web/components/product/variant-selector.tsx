'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { type ProductDetailVariant } from '@/types/product-detail';

const GLASS = 'var(--bg-elevated)';
const BORDER = '1px solid var(--border-color)';
const ACTIVE_BG = 'color-mix(in srgb, var(--accent) 15%, transparent)';
const ACTIVE_BORDER = '1px solid color-mix(in srgb, var(--accent) 40%, transparent)';

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
          <p className="mb-2 text-sm font-semibold text-text-primary">{type}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button key={v.id} onClick={() => onSelect(v)}
                  className="relative rounded-xl px-3 py-1.5 text-sm font-semibold transition-all"
                  style={{
                    background: isSelected ? ACTIVE_BG : GLASS,
                    border: isSelected ? ACTIVE_BORDER : BORDER,
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {v.value}
                  {isSelected && <CheckCircle size={13} className="ml-1 inline text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="rounded-2xl p-4 bg-surface border border-border">
          {selectedVariant.sku && <p className="text-[11px] text-text-tertiary">SKU: {selectedVariant.sku}</p>}
          {selectedVariant.price != null && (
            <p className="text-lg font-black text-text-primary">
              ₹{selectedVariant.price.toLocaleString()}
              {selectedVariant.compareAtPrice && (
                <span className="ml-2 text-sm text-text-tertiary line-through">₹{selectedVariant.compareAtPrice.toLocaleString()}</span>
              )}
            </p>
          )}
          {selectedVariant.stockStatus && (
            <p className="mt-1 text-xs font-semibold" style={{
              color: selectedVariant.stockStatus === 'IN_STOCK' ? 'var(--status-success)'
                : selectedVariant.stockStatus === 'LOW_STOCK' ? 'var(--accent)' : 'var(--status-error)',
            }}>
              {selectedVariant.stockStatus === 'IN_STOCK' ? 'In Stock'
                : selectedVariant.stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
