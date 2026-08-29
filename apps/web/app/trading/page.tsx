import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CategoryStrip } from '@/components/trading/category-strip';
import TradingPageShell from '@/components/trading/trading-page-shell';
import TradingDiscoveryClient from './TradingDiscoveryClient';

export const metadata: Metadata = {
  title: { absolute: 'TRADORS | Global Manufacturers, Suppliers & Distributors Directory' },
  description:
    'Find verified manufacturers, suppliers, traders, and distributors worldwide. Explore business profiles, products, capabilities, and locations, compare suppliers, and connect directly with trusted trade partners through TRADORS.',
  openGraph: {
    title: 'TRADORS | Global Manufacturers, Suppliers & Distributors Directory',
    description:
      'Find verified manufacturers, suppliers, traders, and distributors worldwide. Explore business profiles, products, capabilities, and locations, compare suppliers, and connect directly with trusted trade partners through TRADORS.',
    type: 'website',
  },
  alternates: {
    canonical: '/trading',
  },
};

export default function TradingPage() {
  return (
    <TradingPageShell>
      <Suspense
        fallback={
          <div className="h-16 overflow-x-auto rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary">
              <span>Loading categories…</span>
            </div>
          </div>
        }
      >
        <CategoryStrip />
        <TradingDiscoveryClient />
      </Suspense>
    </TradingPageShell>
  )
}
