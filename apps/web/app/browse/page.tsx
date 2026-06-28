'use client'

import { Suspense } from 'react'
import ProductDiscoveryClient from '../../components/discovery/ProductDiscoveryClient'

function BrowsePageContent() {
  return <ProductDiscoveryClient />
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#1D0001' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
        </div>
      }
    >
      <BrowsePageContent />
    </Suspense>
  )
}