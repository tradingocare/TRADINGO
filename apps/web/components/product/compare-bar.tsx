'use client';

import Link from 'next/link';
import { X, ArrowLeftRight } from 'lucide-react';
import { useCompareStore } from '@/store/compare-store';

export default function CompareBar() {
  const { items, remove, clear } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-accent/20 bg-surface px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-text-tertiary">
          <ArrowLeftRight size={14} className="text-accent" />
          Compare ({items.length}/4)
        </span>
        <div className="flex flex-1 gap-2">
          {items.map(item => (
            <div key={item._id} className="flex flex-shrink-0 items-center gap-2 rounded-full bg-surface-secondary pl-1 pr-2 py-1">
              <img src={item.images?.[0] || '/placeholder-product.jpg'} alt={item.title} className="h-6 w-6 rounded-full object-cover" />
              <span className="max-w-[100px] truncate text-[11px] text-text-primary">{item.title}</span>
              <button onClick={() => remove(item._id)} aria-label="Remove">
                <X size={12} className="text-text-tertiary hover:text-primary" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={clear} className="whitespace-nowrap text-xs text-text-tertiary hover:text-accent">Clear</button>
        <Link href="/compare" className="whitespace-nowrap rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-btn-primary-text hover:brightness-110">
          Compare Now →
        </Link>
      </div>
    </div>
  );
}
