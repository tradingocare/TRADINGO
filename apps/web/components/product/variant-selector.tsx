'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { type ProductDetailVariant } from '@/types/product-detail';

const GLASS = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.09)';
const ACTIVE_BG = 'rgba(255,77,0,0.15)';
const ACTIVE_BORDER = '1px solid rgba(255,77,0,0.4)';

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
          <p className="mb-2 text-sm font-semibold text-white/70">{type}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button key={v.id} onClick={() => onSelect(v)}
                  className="relative rounded-xl px-3 py-1.5 text-sm font-semibold transition-all"
                  style={{
                    background: isSelected ? ACTIVE_BG : GLASS,
                    border: isSelected ? ACTIVE_BORDER : BORDER,
                    color: isSelected ? '#FF4D00' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {v.value}
                  {isSelected && <CheckCircle size={13} className="ml-1 inline" style={{ color: '#FF4D00' }} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="rounded-2xl p-4" style={{ background: GLASS, border: BORDER }}>
          {selectedVariant.sku && <p className="text-[11px] text-white/40">SKU: {selectedVariant.sku}</p>}
          {selectedVariant.price != null && (
            <p className="text-lg font-black text-white">
              ₹{selectedVariant.price.toLocaleString()}
              {selectedVariant.compareAtPrice && (
                <span className="ml-2 text-sm text-white/30 line-through">₹{selectedVariant.compareAtPrice.toLocaleString()}</span>
              )}
            </p>
          )}
          {selectedVariant.stockStatus && (
            <p className="mt-1 text-xs font-semibold" style={{
              color: selectedVariant.stockStatus === 'IN_STOCK' ? '#4ade80'
                : selectedVariant.stockStatus === 'LOW_STOCK' ? '#F2C94C' : '#f87171',
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
