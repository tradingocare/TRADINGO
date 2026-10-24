import Link from 'next/link';
import { Package } from 'lucide-react';
import type { CompanyProduct } from '@/lib/api/companies';

/**
 * "More Products From This Seller" (product-detail reference §14).
 *
 * Data: the existing PUBLIC endpoint GET /companies/{slug}/products
 * (the same source the public company profile already renders) — no API change.
 *
 * Data-integrity rules honoured here:
 *  - price is shown only when the API actually returns a positive number;
 *    otherwise the approved neutral fallback "Price on Request" (the same wording
 *    the public company profile already uses). Nothing is invented.
 *  - unit / MOQ rows appear only when the real values exist.
 *  - image uses real ProductMedia; the approved icon fallback when absent.
 *  - every tile links to the canonical /products/{slug} route (never /trading/{slug}).
 */
export function SellerProductsSection({
  products,
  sellerName,
}: {
  products: CompanyProduct[];
  sellerName?: string;
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-10" id="seller-products" aria-label="More products from this seller">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12">
        <h2 className="text-xl font-black text-text-primary lg:text-2xl">
          More Products From This Seller
        </h2>
        {sellerName ? (
          <p className="mt-1 text-sm text-text-secondary">{sellerName}</p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => {
            const image = product.media?.find((m) => m.type === 'IMAGE')?.url;
            // Runtime presence check: the endpoint does not always include pricing,
            // so the price slot is only rendered for a real positive value.
            const hasPrice = typeof product.price === 'number' && Number.isFinite(product.price) && product.price > 0;
            const hasUnit = !!product.unit;
            const hasMoq = typeof product.moq === 'number' && product.moq > 1;

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group flex gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-accent/40"
              >
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-elevated">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <Package size={22} className="text-text-tertiary" />
                  )}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="line-clamp-2 text-[13px] font-bold leading-snug text-text-primary transition-colors group-hover:text-accent">
                    {product.name}
                  </span>
                  {product.category?.name ? (
                    <span className="truncate text-[11px] text-text-tertiary">{product.category.name}</span>
                  ) : null}
                  <span className="mt-auto text-[13px] font-extrabold text-text-primary">
                    {hasPrice ? `₹${product.price.toLocaleString('en-IN')}` : 'Price on Request'}
                  </span>
                  {(hasUnit || hasMoq) && (
                    <span className="text-[10px] text-text-tertiary">
                      {hasUnit ? `Per ${product.unit}` : ''}
                      {hasUnit && hasMoq ? ' · ' : ''}
                      {hasMoq ? `MOQ ${product.moq}` : ''}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
