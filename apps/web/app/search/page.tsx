import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchContent } from './search-content';

export const metadata: Metadata = {
  title: 'Search Products & Services — TRADINGO',
  description: 'Search thousands of B2B products and services from verified Indian suppliers on TRADINGO.',
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #FF4D00, transparent 70%)', filter: 'blur(100px)' }} />
      </div>
      <div className="relative z-10">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchContent q={searchParams.q || ''} />
        </Suspense>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24">
      <div className={`h-10 w-96 rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className={`mt-2 h-4 w-64 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`rounded-3xl p-6 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className={`h-40 w-full rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className={`mt-4 h-5 w-3/4 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className={`mt-2 h-6 w-1/3 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className={`mt-3 h-4 w-1/2 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
