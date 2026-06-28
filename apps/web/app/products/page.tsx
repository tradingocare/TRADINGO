import type { Metadata } from 'next'
import { Suspense }      from 'react'
import ProductsPageClient from './ProductsPageClient'

export const metadata: Metadata = {
  title: 'Products & Services � TRADINGO Discovery',
  description:
    'Discover 33,600+ products and services from verified Indian suppliers. AI-powered search with Near-to-Far geo discovery.',
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
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#1D0001' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading discovery engine...</p>
      </div>
    </div>
  )
}
