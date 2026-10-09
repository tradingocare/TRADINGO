'use client'

/**
 * WIDE CATEGORY MARKETPLACE CARD (/trading catalog — Founder reference IA)
 *
 *   CATEGORY NAME
 *   CATEGORY IMAGE BOX            │  SUBCATEGORY   SUBCATEGORY   SUBCATEGORY
 *                                 │  real listing   real listing   real listing
 *   View All in {category}        │
 *
 * Founder decision (authoritative, unchanged): the compact list under each subcategory
 * shows REAL Product / Service entities — never CatalogItem taxonomy terms.
 *
 * Data (existing public endpoints only — no API/DB change):
 *   GET /marketplace-catalog-bridge/categories/tree                      → catalog tree
 *   GET /marketplace-catalog-bridge/products/search?catalogSubcategoryId → real Products
 *   GET /tradeserv/search/v2?catalogSubcategoryId                        → real services
 *
 * Click map: product → /products/{slug} · service → /tradeserv/p/{slug}
 *            category/subcategory → /trading?catalogCategory=… (verified context filter)
 *
 * No invented data: no category image exists in the catalog (CatalogCategory.icon is null
 * for every seeded category), so the approved token fallback tile is used. A price is shown
 * only when the API returns a real value greater than zero.
 *
 * Scale: rows are fetched only once the card is in (or near) the viewport, so listing all
 * 160 categories never fires 1,600 subcategory queries at once.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Boxes, ChevronDown, ChevronRight, Package, Wrench, Loader2 } from 'lucide-react'
import { useCardPreviews } from '@/hooks/use-marketplace-catalog-bridge'
import { selectSubPreview } from '@/lib/api/marketplace-catalog-bridge'
import { previewScheduler, usePreviewSlot } from '@/lib/query/preview-scheduler'
import { cn } from '@/lib/utils'
import { marketplaceHref, type CatalogCategoryNode } from './category-card'

/** Real listing rows rendered per subcategory before the "+N more" link (reference shows 4). */
const PRODUCT_PREVIEW_LIMIT = 4
/**
 * Max subcategory columns shown before the in-card "more" toggle reveals the rest —
 * the preview stays exactly as approved; remaining subcategories expand inside the
 * same card (same SubcategoryColumn, same links), never in a second section.
 */
const SUBCATEGORY_PREVIEW_LIMIT = 6

/** True once the element is within `rootMargin` of the viewport. Phase 3G: 200px. */
function useInView<T extends HTMLElement>(rootMargin = '200px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return { ref, inView }
}

function formatPrice(n: number): string {
  return `\u20B9${n.toLocaleString('en-IN')}`
}

/* ───────────────────────────── one real listing row ───────────────────────────── */

function ListingRow({ href, name, imageUrl, price, unit, isService }: {
  href: string
  name: string
  imageUrl?: string | null
  price?: number | null
  unit?: string | null
  isService?: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        aria-label={name}
        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-secondary"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg-elevated text-text-tertiary">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : isService ? (
            <Wrench size={14} />
          ) : (
            <Package size={14} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] leading-tight text-text-secondary transition-colors group-hover:text-text-primary">
            {name}
          </span>
          {typeof price === 'number' && price > 0 && (
            <span className="mt-0.5 block text-[11px] font-semibold text-accent">
              {formatPrice(price)}
              {unit ? <span className="font-normal text-text-tertiary"> /{unit}</span> : null}
            </span>
          )}
        </span>
        <ChevronRight size={13} className="shrink-0 text-text-tertiary transition-colors group-hover:text-accent" />
      </Link>
    </li>
  )
}

/* ───────────────────── real listings of one subcategory column ───────────────────── */

function SubcategoryColumn({ subcategory, categorySlug, active, enabled, preview, pending, failed }: {
  subcategory: CatalogCategoryNode['subcategories'][number]
  categorySlug: string
  active: boolean
  /** Rows are only requested once the owning card is near the viewport. */
  enabled: boolean
  /** This column's slice of the card-scoped aggregated response (Phase 3J). */
  preview?: { products?: any[]; productTotal?: number; services?: any[]; status?: string }
  /** True while the card request is in flight or waiting for a slot. */
  pending: boolean
  /** True on card transport failure or this sub's own error status. */
  failed: boolean
}) {
  // Real Product entities mapped to this catalog subcategory (Phase 3J: sliced
  // from the single card response — never fetched per column anymore).
  const productRows = useMemo(
    () => ((preview?.products ?? []) as any[]).filter((p) => !!p?.slug),
    [preview],
  )
  // Real services for product-empty subcategories (Phase 3J: decided
  // server-side per subcategory by the aggregated endpoint — same EMPTY
  // fallback semantics, no client-side second query).
  const serviceRows = useMemo(
    () => ((preview?.services ?? []) as any[]).filter((s: any) => !!s?.slug),
    [preview],
  )
  const hasRows = productRows.length > 0 || serviceRows.length > 0

  const totalProducts = preview?.productTotal ?? productRows.length
  const hiddenProducts = Math.max(0, totalProducts - productRows.length)
  // Card transport failure OR this sub's own error status — same honest branch.
  const subFailed = failed || preview?.status === 'error'

  return (
    <div className={cn('min-w-0 rounded-lg border border-border/70 bg-bg-elevated/40 p-2', active && 'border-accent/40')}>
      {/* SUBCATEGORY NAME */}
      <div className="flex items-center gap-1.5 px-1 pb-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
          <Boxes size={11} />
        </span>
        <Link
          href={marketplaceHref('/trading', { categorySlug, subcategorySlug: subcategory.slug })}
          className="min-w-0 flex-1 truncate text-[12px] font-bold text-text-primary transition-colors hover:text-accent"
        >
          {subcategory.name}
        </Link>
      </div>

      {!enabled && (
        <div className="px-1 py-3 text-[11px] text-text-tertiary">Loading listings…</div>
      )}

      {enabled && pending && (
        <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-text-tertiary">
          <Loader2 size={12} className="animate-spin" /> Loading…
        </div>
      )}

      {enabled && subFailed && productRows.length === 0 && (
        <p className="px-1 py-2 text-[11px] text-text-tertiary">Listings unavailable right now.</p>
      )}

      {enabled && !pending && !subFailed && !hasRows && (
        <p className="px-1 py-2 text-[11px] text-text-tertiary">
          No products or services listed here yet.
        </p>
      )}

      {hasRows && (
        <ul className="space-y-0.5">
          {productRows.map((p: any) => (
            <ListingRow
              key={String(p.id)}
              href={`/products/${p.slug}`}
              name={p.name}
              imageUrl={(p.media ?? []).find((m: any) => m?.type === 'IMAGE' && m?.url)?.url ?? null}
              price={Number(p.price ?? 0)}
              unit={p.unit}
              isService={String(p.productType) === 'SERVICE'}
            />
          ))}
          {serviceRows.map((s: any) => (
            <ListingRow
              key={String(s.id ?? s.slug)}
              href={`/tradeserv/p/${s.slug}`}
              name={s.name}
              imageUrl={s.logo ?? null}
              isService
            />
          ))}
        </ul>
      )}

      {hiddenProducts > 0 && (
        <Link
          href={marketplaceHref('/trading', { categorySlug, subcategorySlug: subcategory.slug })}
          className="mt-1 inline-flex items-center gap-1 px-1 text-[11px] font-semibold text-accent hover:underline"
        >
          +{hiddenProducts} more in {subcategory.name}
        </Link>
      )}
    </div>
  )
}

/* ─────────────────────────── the wide category card ─────────────────────────── */

export function CategoryMarketplaceCard({ category, isSelected, imageUrl, basePath = '/trading' }: {
  category: CatalogCategoryNode
  isSelected: boolean
  /** Real image URL when an approved source provides one. Absent → approved fallback tile. */
  imageUrl?: string | null
  basePath?: string
}) {
  // Open by default: the reference shows the subcategory listings, not a collapsed header.
  const [expanded, setExpanded] = useState(true)
  // Progressive disclosure: the 6-column preview is the default; the footer toggle
  // reveals every remaining subcategory inside this same card.
  const [showAllSubcategories, setShowAllSubcategories] = useState(false)
  const { ref, inView } = useInView<HTMLElement>()

  const subcategories = category.subcategories ?? []
  const previewCount = Math.min(SUBCATEGORY_PREVIEW_LIMIT, subcategories.length)
  const hiddenSubcategories = Math.max(0, subcategories.length - previewCount)
  const visibleSubcategories = showAllSubcategories ? subcategories : subcategories.slice(0, previewCount)

  // Phase 3J: ONE scheduler ticket per card (was: one ticket per subcategory
  // preview). Priority sampled at this card's own anchor element.
  const cardKey = `preview:card:${category.id}`
  const cardSlot = usePreviewSlot(cardKey, inView, ref)
  // All subcategory IDs up front (≤10, within the endpoint cap) so the
  // footer toggle reveals remaining columns without a second request.
  const cardSubIds = useMemo(() => subcategories.map(s => s.id), [subcategories])
  const cardQuery = useCardPreviews(cardSubIds, inView && cardSlot)
  useEffect(() => {
    if (cardQuery.isSuccess || cardQuery.isError) previewScheduler.release(cardKey)
  }, [cardQuery.isSuccess, cardQuery.isError, cardKey])
  // Slot-wait shows the spinner; settled states flow from the response below.
  const cardWaiting = inView && !cardSlot && !cardQuery.data && !cardQuery.isError

  return (
    <section
      ref={ref}
      className="overflow-hidden rounded-xl border bg-surface"
      style={{ borderColor: isSelected ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'var(--border-color)' }}
      aria-label={`${category.name} category`}
    >
      {/* CATEGORY NAME */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Link
          href={marketplaceHref(basePath, { categorySlug: category.slug })}
          className="min-w-0 flex-1 truncate text-[17px] font-extrabold text-text-primary transition-colors hover:text-accent"
        >
          {category.name}
        </Link>
        <span className="hidden shrink-0 rounded-full bg-bg-elevated px-2.5 py-0.5 text-[11px] font-semibold text-text-tertiary sm:inline-block">
          {subcategories.length.toLocaleString('en-IN')} subcategories
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name} category`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:text-accent"
        >
          <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 p-4 lg:flex-row">
          {/* CATEGORY IMAGE BOX — immediately below the category name, left of the columns. */}
          <Link
            href={marketplaceHref(basePath, { categorySlug: category.slug })}
            aria-label={`Browse ${category.name}`}
            className="block w-full shrink-0 overflow-hidden rounded-lg border border-border bg-bg-elevated lg:w-[240px]"
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={category.name} loading="lazy" className="aspect-[16/9] w-full object-cover lg:aspect-auto lg:h-full" />
            ) : (
              /* Approved fallback: token surface + icon system. No invented imagery.
                 Fills the card's left column on desktop (reference composition) while
                 keeping the 16:9 band on mobile. */
              <span className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 text-text-tertiary lg:aspect-auto lg:h-full lg:min-h-[240px]">
                <Boxes size={34} className="text-accent/70" />
                <span className="px-4 text-center text-[10px] font-semibold uppercase tracking-wider">
                  {category.name}
                </span>
              </span>
            )}
          </Link>

          {/* SUBCATEGORY COLUMNS with real listings */}
          <div className="min-w-0 flex-1">
            {subcategories.length === 0 ? (
              <p className="rounded-lg border border-border bg-bg-elevated/40 px-3 py-4 text-[11px] text-text-tertiary">
                No subcategories published yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleSubcategories.map((sub, i) => (
                  <SubcategoryColumn
                    key={sub.id}
                    subcategory={sub}
                    categorySlug={category.slug}
                    active={isSelected && i === 0}
                    enabled={inView}
                    preview={selectSubPreview(cardQuery.data, sub.id)}
                    pending={cardWaiting || cardQuery.isLoading}
                    failed={cardQuery.isError}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW ALL */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-4 py-2.5">
        <Link
          href={marketplaceHref(basePath, { categorySlug: category.slug })}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
        >
          View All in {category.name}
          <ChevronRight size={13} />
        </Link>
        {hiddenSubcategories > 0 && (
          <button
            type="button"
            onClick={() => {
              if (showAllSubcategories) {
                setShowAllSubcategories(false)
              } else {
                setShowAllSubcategories(true)
                setExpanded(true)
              }
            }}
            aria-expanded={showAllSubcategories}
            aria-label={
              showAllSubcategories
                ? `Show fewer subcategories in ${category.name}`
                : `Show ${hiddenSubcategories} more subcategories in ${category.name}`
            }
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
          >
            {showAllSubcategories ? 'Show fewer subcategories' : `+${hiddenSubcategories} more subcategories`}
          </button>
        )}
      </div>
    </section>
  )
}

/** Local listings are only fetched once a card is near the viewport — exposed for clarity. */
export const CATEGORY_CARD_LAZY = true
