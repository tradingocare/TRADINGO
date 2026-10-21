import { permanentRedirect } from 'next/navigation';

/**
 * FOUNDER ROUTE CORRECTION — /trading retired as a permanent 308 alias of
 * /product, which now serves the complete trading product-discovery
 * experience (CategoryStrip + embedded discovery engine + directory
 * sections, byte-equivalent to the former /trading page).
 *
 * Scope guard: only the listing route redirects. /trading/[slug] remains a
 * dedicated 308 to the canonical product-detail route /products/{slug}.
 */
export default function TradingRedirect() {
  permanentRedirect('/product');
}
