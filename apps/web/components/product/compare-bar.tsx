'use client';

import Link from 'next/link';
import { X, ArrowLeftRight } from 'lucide-react';
import { useCompareStore } from '@/store/compare-store';

export default function CompareBar() {
  const { items, remove, clear } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-500/20 bg-black/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-white/50">
          <ArrowLeftRight size={14} className="text-amber-500" />
          Compare ({items.length}/4)
        </span>
        <div className="flex flex-1 gap-2">
          {items.map(item => (
            <div key={item._id} className="flex flex-shrink-0 items-center gap-2 rounded-full bg-white/8 pl-1 pr-2 py-1">
              <img src={item.images?.[0] || '/placeholder-product.jpg'} alt={item.title} className="h-6 w-6 rounded-full object-cover" />
              <span className="max-w-[100px] truncate text-[11px] text-white">{item.title}</span>
              <button onClick={() => remove(item._id)} aria-label="Remove">
                <X size={12} className="text-white/40 hover:text-white" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={clear} className="whitespace-nowrap text-xs text-white/40 hover:text-white">Clear</button>
        <Link href="/compare" className="whitespace-nowrap rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700">
          Compare Now →
        </Link>
      </div>
    </div>
  );
}
