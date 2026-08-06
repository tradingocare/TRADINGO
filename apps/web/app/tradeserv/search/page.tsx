import type { Metadata } from 'next';
import { Suspense } from 'react';
import TradeServSearchClient from './search-client';

export const metadata: Metadata = {
  title: 'Search Professionals \u2014 TradeServ | TRADINGO',
  description:
    'Find TRADTRUST-verified accountants, legal experts, consultants, and creative professionals on TradeServ. Search by name, category, service, or location.',
  openGraph: {
    title: 'Search Professionals \u2014 TradeServ | TRADINGO',
    description:
      'Find TRADTRUST-verified accountants, legal experts, consultants, and creative professionals on TradeServ.',
    url: '/tradeserv/search',
    type: 'website',
    siteName: 'TRADINGO',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', filter: 'blur(100px)' }}
        />
      </div>
      <div className="relative z-10">
        <Suspense fallback={<div className="p-8 text-center text-text-tertiary">Loading search...</div>}>
          <TradeServSearchClient />
        </Suspense>
      </div>
    </div>
  );
}
