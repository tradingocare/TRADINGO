import type { Metadata } from 'next';
import CompareClient from './compare-client';

/**
 * PHASE 2-A §2 — /compare indexing policy.
 * CURRENT: client-only session utility with no metadata (indexable by default).
 * PROBLEM: zero crawl value (session-store comparison tray).
 * POLICY: always noindex + follow (functionality, UI, route, and product
 *   detail pages untouched — metadata only). Self-canonical (utility page).
 */
export const metadata: Metadata = {
  title: 'Compare Products — TRADINGO',
  description: 'Compare TRADINGO products side by side on price, seller, trust score, MOQ and delivery.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://tradingo.in/compare' },
};

export default function ComparePage() {
  return <CompareClient />;
}
