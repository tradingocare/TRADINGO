'use client'

/**
 * LEFT-SIDE CATEGORY CARD (/trading marketplace layer)
 *
 * One complete card per CatalogCategory, matching the Founder reference:
 *   CATEGORY NAME → CATEGORY IMAGE BOX → per subcategory (name + taxonomy leaf items) → View All
 *
 * Founder decision (authoritative): the compact list under each subcategory shows REAL
 * Product / Service entities — never CatalogItem taxonomy terms.
 *
 * Data (read-only, existing public endpoints — no API/DB changes):
 *   GET /marketplace-catalog-bridge/categories/tree                    → CatalogCategory → CatalogSubcategory
 *   GET /marketplace-catalog-bridge/products/search?catalogSubcategoryId → real Product entities
 *   GET /tradeserv/search/v2?catalogSubcategoryId                      → real professional/service entities
 *
 * Click map: product → /products/{slug}   ·   service → /tradeserv/p/{slug}
 *
 * Ordering is authoritative and never re-sorted here:
 *   categories    : sortOrder asc, name asc            (catalog adapter)
 *   subcategories : name asc                           (no sortOrder column exists on CatalogSubcategory)
 *   products      : Product.createdAt desc             (bridge products/search)
 *   services      : the endpoint's own relevance order  (tradeserv search/v2)
 *
 * No invented data: an image is rendered only when a real image URL is supplied by a caller;
 * otherwise the approved fallback tile is used. Counts/names all come from the API.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Boxes, ChevronDown, ChevronRight, Package, Wrench, Loader2 } from 'lucide-react'
import { useEnrichedProductSearch } from '@/hooks'
// TradeServ hooks are not re-exported by the hooks barrel — imported directly, as the
// existing /tradeserv category listing does.
import { useTradeServSearchV2 } from '@/hooks/use-tradeserv'
import { cn } from '@/lib/utils'

/** Subset of EnrichedCategoryTreeResponse['catalogTree'][number] the card needs. */
export interface CatalogCategoryNode {
  id: string
  name: string
  slug: string
  description?: string | null
  sortOrder: number
  subcategories: {
    id: string
    categoryId: string
    name: string
    slug: string
    itemCount: number
  }[]
}

export interface CatalogSelection {
  categorySlug?: string
  subcategorySlug?: string
  itemSlug?: string
}

/** Builds the marketplace URL carrying the canonical catalog context. */
export function marketplaceHref(basePath: string, selection: CatalogSelection): string {
  const sp = new URLSearchParams()
  if (selection.categorySlug) sp.set('catalogCategory', selection.categorySlug)
  if (selection.subcategorySlug) sp.set('catalogSubcategory', selection.subcategorySlug)
  if (selection.itemSlug) sp.set('catalogItem', selection.itemSlug)
  const qs = sp.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

/** Max real product rows rendered per subcategory before the "+N more" link. */
const PRODUCT_PREVIEW_LIMIT = 4
/** Max real service rows rendered per subcategory. */
const SERVICE_PREVIEW_LIMIT = 3

/** One compact row: real thumbnail when real media exists, otherwise the approved fallback icon. */
function EntityRow({
  href, name, imageUrl, icon, tone,
}: {
  href: string
  name: string
  imageUrl?: string | null
  icon: React.ReactNode
  tone: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-surface-secondary"
        aria-label={name}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg-elevated"
          style={{ color: tone }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-text-secondary group-hover:text-text-primary">
          {name}
        </span>
        <ChevronRight size={13} className="shrink-0 text-text-tertiary group-hover:text-accent" />
      </Link>
    </li>
  )
}
/** Max subcategories rendered per card before the "view all" affordance. */
const SUBCATEGORY_PREVIEW_LIMIT = 6

/* ─────────────── real products & services of the subcategory ─────────────── */

function SubcategoryEntities({ subcategory, categorySlug, subcategorySlug }: {
  subcategory: CatalogCategoryNode['subcategories'][number]
  categorySlug: string
  subcategorySlug: string
}) {
  // Real Product entities mapped to this catalog subcategory.
  const products = useEnrichedProductSearch({
    catalogSubcategoryId: subcategory.id,
    page: 1,
    limit: PRODUCT_PREVIEW_LIMIT,
  })
  // Real service entities — the public TradeServ search already accepts the same
  // canonical catalog filters (service type enforced server-side).
  const services = useTradeServSearchV2({ catalogSubcategoryId: subcategory.id, limit: SERVICE_PREVIEW_LIMIT })

  // A row is only rendered when the entity carries the slug its destination needs.
  const productRows = ((products.data?.data ?? []) as any[]).filter((p) => !!p?.slug)
  const serviceRows = (((services.data as any)?.data ?? []) as any[]).filter((s) => !!s?.slug)
  const totalProducts = products.data?.total ?? productRows.length
  const hiddenProducts = Math.max(0, totalProducts - productRows.length)

  const isLoading = (products.isLoading || services.isLoading)
    && productRows.length === 0 && serviceRows.length === 0
  const hasRows = productRows.length > 0 || serviceRows.length > 0

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <span className="inline-flex items-center gap-2 text-[11px] text-text-tertiary">
          <Loader2 size={12} className="animate-spin" /> Loading products &amp; services…
        </span>
      </div>
    )
  }

  if (!hasRows) {
    if (products.isError && services.isError) {
      return (
        <div className="px-3 py-2 text-[11px] text-text-tertiary">
          Products &amp; services unavailable right now.
        </div>
      )
    }
    // Approved empty state — taxonomy terms are never substituted to fill the space.
    return (
      <div className="px-3 py-2 text-[11px] text-text-tertiary">
        No products or services listed in this subcategory yet.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border/60">
      {productRows.map((p) => (
        <EntityRow
          key={String(p.id)}
          href={`/products/${p.slug}`}
          name={p.name}
          imageUrl={(p.media ?? []).find((m: any) => m?.type === 'IMAGE' && m?.url)?.url ?? null}
          icon={<Package size={14} />}
          tone="var(--text-secondary)"
        />
      ))}
      {serviceRows.map((s) => (
        <EntityRow
          key={String(s.id ?? s.slug)}
          href={`/tradeserv/p/${s.slug}`}
          name={s.name}
          imageUrl={s.logo ?? null}
          icon={<Wrench size={14} />}
          tone="var(--status-info)"
        />
      ))}
      {hiddenProducts > 0 && (
        <li>
          <Link
            href={marketplaceHref('/trading', { categorySlug, subcategorySlug })}
            className="flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-accent hover:underline"
          >
            +{hiddenProducts} more in {subcategory.name}
          </Link>
        </li>
      )}
    </ul>
  )
}

/* ─────────────────────────── one subcategory block ─────────────────────────── */

function SubcategoryBlock({ subcategory, categorySlug, defaultOpen }: {
  subcategory: CatalogCategoryNode['subcategories'][number]
  categorySlug: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Boxes size={13} />
        </span>
        <Link
          href={marketplaceHref('/trading', { categorySlug, subcategorySlug: subcategory.slug })}
          className="min-w-0 flex-1 truncate text-[13px] font-bold text-text-primary transition-colors hover:text-accent"
        >
          {subcategory.name}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${subcategory.name}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:text-accent"
        >
          <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open && (
        <SubcategoryEntities
          subcategory={subcategory}
          categorySlug={categorySlug}
          subcategorySlug={subcategory.slug}
        />
      )}
    </div>
  )
}

/* ─────────────────────────── the category card ─────────────────────────── */

export function CategoryCard({
  category,
  isSelected,
  imageUrl,
  basePath = '/trading',
}: {
  category: CatalogCategoryNode
  isSelected: boolean
  /** Real image URL when an approved source provides one. Absent → approved fallback tile. */
  imageUrl?: string | null
  basePath?: string
}) {
  const [expanded, setExpanded] = useState(isSelected)
  const subcategories = category.subcategories ?? []
  // Counts shown inside the card come from real listings, not from taxonomy item counts.
  const visibleSubcategories = subcategories.slice(0, SUBCATEGORY_PREVIEW_LIMIT)
  const hiddenSubcategories = subcategories.length - visibleSubcategories.length

  return (
    <section
      className="overflow-hidden rounded-xl border bg-surface"
      style={{ borderColor: isSelected ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'var(--border-color)' }}
      aria-label={`${category.name} category`}
    >
      {/* CATEGORY NAME */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <Link
          href={marketplaceHref(basePath, { categorySlug: category.slug })}
          className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-text-primary transition-colors hover:text-accent"
        >
          {category.name}
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name} category`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:text-accent"
        >
          <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {/* CATEGORY IMAGE BOX — immediately below the category name (expanded state only;
          a collapsed card is a compact header so a long rail stays navigable). */}
      {expanded && (
      <div className="px-3 pt-2.5">
        <Link
          href={marketplaceHref(basePath, { categorySlug: category.slug })}
          className="block overflow-hidden rounded-lg border border-border bg-bg-elevated"
          aria-label={`Browse ${category.name}`}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={category.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          ) : (
            /* Approved fallback: token surface + icon system. No invented imagery. */
            <span className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 text-text-tertiary">
              <Boxes size={30} className="text-accent/70" />
              <span className="px-4 text-center text-[10px] font-semibold uppercase tracking-wider">
                {category.name}
              </span>
            </span>
          )}
        </Link>
      </div>
      )}

      {expanded && (
        <>
          {visibleSubcategories.map((sub, i) => (
            <SubcategoryBlock
              key={sub.id}
              subcategory={sub}
              categorySlug={category.slug}
              defaultOpen={isSelected && i === 0}
            />
          ))}

          {subcategories.length === 0 && (
            <div className="border-t border-border px-3 py-2 text-[11px] text-text-tertiary">
              No subcategories published yet.
            </div>
          )}
        </>
      )}

      {/* VIEW ALL */}
      <div className="border-t border-border px-3 py-2.5">
        <Link
          href={marketplaceHref(basePath, { categorySlug: category.slug })}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
        >
          View All in {category.name}
          <ChevronRight size={12} />
        </Link>
        {hiddenSubcategories > 0 && (
          <span className="ml-2 text-[10px] text-text-tertiary">
            ({hiddenSubcategories} more subcategories)
          </span>
        )}
      </div>
    </section>
  )
}
