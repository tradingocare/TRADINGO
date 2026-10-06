'use client'

/**
 * RIGHT-SIDE POPULAR PRODUCTS (/trading marketplace layer)
 *
 * Compact contextual discovery cards. Structurally distinct from the CENTER
 * detailed ProductCard (which is NOT modified by this component).
 *
 *   image → name → price (+ original only when real) → unit/MOQ → seller → verified
 *
 * Data: GET /marketplace-catalog-bridge/products/search with the current catalog
 * context (catalogCategoryId / catalogSubcategoryId / catalogItemId). That endpoint
 * is the only existing source that filters by canonical catalog context, so it is
 * reused as-is (no new API, no recommendation engine).
 *
 * Ordering: the API's deterministic order — Product.createdAt desc (newest first).
 * No client-side shuffling and no invented popularity score.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Bookmark, BadgeCheck, Package, ArrowRight, AlertCircle,
  Star, ShoppingCart, FileText, MessageCircle, ArrowLeftRight,
} from 'lucide-react'
import { useEnrichedProductSearch } from '@/hooks'
import { fromEnrichedProduct } from '@/components/product/card-converters'
import { useProductActions } from '@/components/product/use-product-actions'
import type { ProductCardModel } from '@/types/product-card'

export interface PopularContext {
  catalogCategoryId?: string
  catalogSubcategoryId?: string
  catalogItemId?: string
  /** Human label for the current selection, e.g. "CNC Machines". */
  label?: string
  /** Slugs of the same selection — used only to build the deep-link URL. */
  categorySlug?: string
  subcategorySlug?: string
  itemSlug?: string
}

function formatPrice(n: number): string {
  return `\u20B9${n.toLocaleString('en-IN')}`
}

/* ─────────────────────────── popular card (reference design) ───────────────────────────
 * Vertical card: image + Save/bookmark/discount overlays, title, price + MRP +
 * rating, unit/MOQ, seller, action row. Every slot is real data — overlays and
 * rows render only when the underlying value exists. Product Card itself
 * (detailed/compact) is NOT touched. */

function PopularProductCard({ model }: { model: ProductCardModel }) {
  const actions = useProductActions(model)
  const image = model.images?.[0]
  const hasDiscount = !!model.originalPrice && model.originalPrice > model.price
  const discountPct = hasDiscount
    ? Math.round(((model.originalPrice! - model.price) / model.originalPrice!) * 100)
    : 0
  const hasRating = model.rating > 0 && model.reviewCount > 0

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/40">
      {/* Image — real ProductMedia only, icon fallback when absent */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
        <Link href={`/products/${model.slug}`} aria-label={model.title} className="block h-full w-full">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={model.title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package size={28} className="text-text-tertiary" />
            </div>
          )}
        </Link>

        {/* Save pill (top-left) — real wishlist toggle */}
        <button
          type="button"
          onClick={actions.handleSave}
          className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--status-error)' }}
        >
          <Bookmark size={11} fill="currentColor" />
          {actions.isSaved ? 'Saved' : 'Save'}
        </button>

        {/* Bookmark (top-right) — same real wishlist toggle */}
        <button
          type="button"
          onClick={actions.handleSave}
          aria-label={actions.isSaved ? 'Remove from saved' : 'Save product'}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated/85 text-text-secondary backdrop-blur-sm transition-colors hover:text-accent"
        >
          <Bookmark
            size={14}
            fill={actions.isSaved ? 'var(--accent)' : 'none'}
            style={{ color: actions.isSaved ? 'var(--accent)' : undefined }}
          />
        </button>

        {/* Discount badge (bottom-left) — only when a real MRP exists */}
        {hasDiscount && (
          <span
            className="absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold"
            style={{
              background: 'color-mix(in srgb, var(--status-error) 16%, transparent)',
              color: 'var(--status-error)',
              border: '1px solid color-mix(in srgb, var(--status-error) 35%, transparent)',
            }}
          >
            -{discountPct}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <Link
          href={`/products/${model.slug}`}
          className="line-clamp-2 text-[13px] font-bold leading-snug text-text-primary transition-colors hover:text-accent"
        >
          {model.title}
        </Link>

        <div className="flex items-center gap-1.5">
          <span className="text-[16px] font-extrabold text-text-primary">{formatPrice(model.price)}</span>
          {hasDiscount && (
            <span className="text-[11px] text-text-tertiary line-through">
              {formatPrice(model.originalPrice!)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
            <Star size={11} className="text-accent" fill="var(--accent)" />
            {hasRating ? model.rating.toFixed(1) : 'New'}
          </span>
        </div>

        {(model.unit || model.moq > 1) && (
          <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-text-tertiary">
            <span>/ {model.unit || 'unit'}</span>
            {model.moq > 1 && <span>MOQ {model.moq}</span>}
          </div>
        )}

        {model.seller.name && (
          <div className="flex min-w-0 items-center gap-1">
            {model.seller.slug ? (
              <Link
                href={`/companies/${model.seller.slug}`}
                className="truncate text-[11px] text-text-secondary transition-colors hover:text-accent"
              >
                {model.seller.name}
              </Link>
            ) : (
              <span className="truncate text-[11px] text-text-secondary">{model.seller.name}</span>
            )}
            {model.seller.isVerified && (
              <BadgeCheck size={12} className="shrink-0" style={{ color: 'var(--status-info)' }} />
            )}
          </div>
        )}

        {/* Action row — all real existing actions, never dead controls */}
        <div className="mt-1 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => actions.handleBuyNow()}
            aria-label="Buy now"
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #ff7a33))' }}
          >
            <ShoppingCart size={13} />
            Buy
          </button>
          <button
            type="button"
            onClick={actions.handleRFQ}
            aria-label="Send RFQ"
            title="Send RFQ"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-secondary transition-colors hover:text-accent"
          >
            <FileText size={13} />
          </button>
          <button
            type="button"
            onClick={actions.handleChat}
            aria-label="Chat with seller"
            title="Chat with seller"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-secondary transition-colors hover:text-accent"
          >
            <MessageCircle size={13} />
          </button>
          <button
            type="button"
            onClick={actions.handleSave}
            aria-label={actions.isSaved ? 'Remove from saved' : 'Save product'}
            title="Save"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-secondary transition-colors hover:text-accent"
          >
            <Bookmark size={13} fill={actions.isSaved ? 'var(--accent)' : 'none'} />
          </button>
          <button
            type="button"
            onClick={actions.handleCompare}
            aria-label="Compare product"
            title="Compare"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-secondary transition-colors hover:text-accent"
          >
            <ArrowLeftRight size={13} />
          </button>
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────── the rail ─────────────────────────── */

export function PopularProductsRail({
  context,
  limit = 5,
  basePath = '/trading',
}: {
  context: PopularContext
  limit?: number
  basePath?: string
}) {
  const { data, isLoading, isError } = useEnrichedProductSearch({
    catalogCategoryId: context.catalogCategoryId,
    catalogSubcategoryId: context.catalogSubcategoryId,
    catalogItemId: context.catalogItemId,
    page: 1,
    limit,
  })

  const models = useMemo(
    () => (data?.data ?? []).map((p: any) => fromEnrichedProduct(p)),
    [data],
  )

  const moreParams = new URLSearchParams()
  if (context.categorySlug) moreParams.set('catalogCategory', context.categorySlug)
  if (context.subcategorySlug) moreParams.set('catalogSubcategory', context.subcategorySlug)
  if (context.itemSlug) moreParams.set('catalogItem', context.itemSlug)
  const moreQs = moreParams.toString()
  const moreHref = moreQs ? `${basePath}?${moreQs}` : basePath

  return (
    <aside className="overflow-hidden rounded-xl border border-border bg-surface" aria-label="Popular products">
      <header className="border-b border-border bg-bg-elevated px-3 py-2.5">
        <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-text-primary">
          Popular Products
        </h3>
        {context.label && (
          <p className="mt-0.5 truncate text-[10px] text-text-tertiary">in {context.label}</p>
        )}
      </header>

      {isLoading && (
        <div className="space-y-3 p-3">
          {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="aspect-[4/3] animate-pulse bg-bg-elevated" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-bg-elevated" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-bg-elevated" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-bg-elevated" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center gap-2 px-3 py-6 text-[11px] text-text-tertiary">
          <AlertCircle size={13} /> Popular products unavailable right now.
        </div>
      )}

      {!isLoading && !isError && models.length === 0 && (
        <div className="px-3 py-6 text-center text-[11px] text-text-tertiary">
          No popular products in this selection yet.
        </div>
      )}

      {!isLoading && !isError && models.length > 0 && (
        <div className="space-y-3 p-3">
          {models.map((m) => <PopularProductCard key={m.id} model={m} />)}
        </div>
      )}

      <div className="border-t border-border p-2.5">
        <Link
          href={moreHref}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[11px] font-semibold text-text-secondary transition-colors hover:text-accent"
        >
          View More Popular Products
          <ArrowRight size={12} />
        </Link>
      </div>
    </aside>
  )
}
