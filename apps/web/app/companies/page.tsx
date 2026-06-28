import type { Metadata } from 'next'
import { Suspense } from 'react'
import CompanyDirectoryClient from './CompanyDirectoryClient'

export const metadata: Metadata = {
  title: 'Tradors Directory — TRADINGO',
  description: 'Browse verified Indian tradors — manufacturers, wholesalers, distributors and service providers. Find trusted B2B partners on TRADINGO.',
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<DirectoryFallback />}>
      <CompanyDirectoryClient />
    </Suspense>
  )
}

function DirectoryFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#1D0001' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading directory...</p>
      </div>
    </div>
  )
}
