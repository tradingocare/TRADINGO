import { permanentRedirect } from 'next/navigation';

/**
 * D1 FULL CONSOLIDATION (founder-approved Option A):
 * /trading/{slug} was a byte-identical duplicate of /products/{slug}.
 * This route is now a permanent 308 redirect to the sole canonical
 * product-detail route /products/{slug}, preserving the slug exactly.
 *
 * Scope guard: only this [slug] product-detail pattern redirects.
 * /trading (listing) and all other legitimate /trading subroutes are
 * unaffected — this file only matches /trading/{single-slug}.
 */
export default async function TradingProductRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/products/${slug}`);
}

