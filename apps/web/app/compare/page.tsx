'use client';

import Link from 'next/link';
import { X, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCompareStore } from '@/store/compare-store';

const ROWS: { label: string; get: (p: any) => string }[] = [
  { label: 'Price', get: p => `₹${p.price.toLocaleString('en-IN')} / ${p.unit}` },
  { label: 'Rating', get: p => `${p.rating.toFixed(1)} (${p.reviewCount})` },
  { label: 'Seller', get: p => p.seller.businessName },
  { label: 'Trust Score', get: p => `${p.seller.trustScore}/100` },
  { label: 'Verified', get: p => p.seller.isVerified ? '✓ Yes' : '✗ No' },
  { label: 'City', get: p => p.seller.city },
  { label: 'MOQ', get: p => `${p.moq} ${p.unit}` },
  { label: 'Delivery', get: p => p.deliveryEta || '—' },
  { label: 'Stock', get: p => p.inStock ? `In stock${p.stockQty ? ` (${p.stockQty})` : ''}` : 'Out of stock' },
  { label: 'GST Invoice', get: p => p.gstInvoiceAvailable ? '✓ Yes' : '✗ No' },
  { label: 'Trade Credit', get: p => p.tradeCreditEligible ? '✓ Yes' : '✗ No' },
  { label: 'Return Policy', get: p => p.returnPolicy || '—' },
];

export default function ComparePage() {
  const { items, remove, clear } = useCompareStore();

  return (
    <div className="min-h-screen bg-surface-secondary pt-24 pb-20 dark:bg-dark-surface-secondary">
      <div className="mx-auto max-w-5xl px-4">
        <Link href="/browse" className="mb-6 flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary">
          <ArrowLeft size={14} /> Back to Browse
        </Link>

        <h1 className="mb-6 text-2xl font-black text-text-primary dark:text-dark-text-primary">
          Compare <span className="text-primary-600 dark:text-primary-400">Products</span>
        </h1>

        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center dark:border-dark-border dark:bg-dark-surface">
            <p className="mb-4 text-text-secondary dark:text-dark-text-secondary">
              Compare list khali hai. Products select karke &quot;Compare&quot; pe click karein.
            </p>
            <Link href="/browse" className="inline-flex rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface dark:border-dark-border dark:bg-dark-surface">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-dark-border">
                  <th className="sticky left-0 bg-surface px-4 py-3 text-left text-xs text-text-secondary dark:bg-dark-surface dark:text-dark-text-secondary">Feature</th>
                  {items.map(p => (
                    <th key={p._id} className="min-w-[180px] px-4 py-3">
                      <div className="relative">
                        <button onClick={() => remove(p._id)} className="absolute -right-1 -top-1 text-text-tertiary hover:text-text-primary dark:text-dark-text-tertiary dark:hover:text-dark-text-primary">
                          <X size={14} />
                        </button>
                        <img src={p.images?.[0] || '/placeholder-product.jpg'} alt={p.title} className="mx-auto mb-2 h-16 w-16 rounded-xl object-cover" />
                        <p className="mb-2 line-clamp-2 text-center text-xs font-semibold text-text-primary dark:text-dark-text-primary">{p.title}</p>
                        <Link href={`/checkout?productId=${p._id}&qty=${p.moq}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 py-1.5 text-[10px] font-semibold text-white hover:bg-primary-700">
                          <ShoppingCart size={11} /> Buy
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr key={row.label} className={`border-b border-border last:border-0 dark:border-dark-border ${i % 2 ? 'bg-surface-secondary/30 dark:bg-dark-surface-secondary/30' : ''}`}>
                    <td className="sticky left-0 bg-surface px-4 py-3 text-xs font-medium text-text-secondary dark:bg-dark-surface dark:text-dark-text-secondary">{row.label}</td>
                    {items.map(p => (
                      <td key={p._id} className="px-4 py-3 text-center text-xs text-text-primary dark:text-dark-text-primary">{row.get(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 text-center">
              <button onClick={clear} className="text-xs text-text-tertiary hover:text-text-primary dark:text-dark-text-tertiary dark:hover:text-dark-text-primary">Clear all</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
