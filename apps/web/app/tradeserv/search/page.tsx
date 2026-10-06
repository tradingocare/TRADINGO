import type { Metadata } from 'next';
import { Suspense } from 'react';
import TradeServSearchClient from './search-client';
import {
  buildSelfCanonical,
  hasIndexAffectingParams,
  resolveSearchParams,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  type SearchParamsLike,
} from '@/lib/seo/seo-policy';

const TRADESERV_SEARCH_URL = 'https://tradingo.in/tradeserv/search';
const TRADESERV_SEARCH_TITLE = 'Search Professionals \u2014 TradeServ | TRADINGO';
const TRADESERV_SEARCH_DESCRIPTION =
  'Find TRADTRUST-verified accountants, legal experts, consultants, and creative professionals on TradeServ. Search by name, category, service, or location.';

/**
 * PHASE 2-A §4 — /tradeserv/search query-variant policy.
 * CURRENT: robots index:true + OG for every URL incl. ?q=/ ?page= / filter
 *   permutations; no canonical. TradeServ detail/listing routes untouched.
 * POLICY: bare /tradeserv/search = index + follow + self-canonical (existing
 *   posture preserved); any query/filter variant = noindex + follow + honest
 *   self-canonical. Search UX/functionality untouched — metadata only.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await resolveSearchParams(searchParams as SearchParamsLike);
  const isVariant = hasIndexAffectingParams(sp);
  return {
    title: TRADESERV_SEARCH_TITLE,
    description: TRADESERV_SEARCH_DESCRIPTION,
    openGraph: {
      title: TRADESERV_SEARCH_TITLE,
      description:
        'Find TRADTRUST-verified accountants, legal experts, consultants, and creative professionals on TradeServ.',
      url: '/tradeserv/search',
      type: 'website',
      siteName: 'TRADINGO',
    },
    robots: isVariant ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
    alternates: { canonical: buildSelfCanonical(TRADESERV_SEARCH_URL, sp) },
  };
}

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
