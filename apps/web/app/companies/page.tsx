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
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-accent border-border animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary text-sm">Loading directory...</p>
      </div>
    </div>
  )
}
