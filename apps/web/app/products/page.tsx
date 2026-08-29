import type { Metadata } from 'next'
import { Suspense }      from 'react'
import ProductsPageClient from './ProductsPageClient'

export const metadata: Metadata = {
  title: { absolute: 'TRADINGO | Global Marketplace to Buy Products & Services' },
  description:
    'Buy products, raw materials, daily essentials, machinery, business supplies, and professional services from verified manufacturers, traders, distributors, and service providers worldwide. Compare prices, connect directly, and request quotations on TRADINGO.',
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProductsPageClient />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-accent border-border animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary text-sm">Loading discovery engine...</p>
      </div>
    </div>
  )
}
