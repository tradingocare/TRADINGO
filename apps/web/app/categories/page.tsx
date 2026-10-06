'use client'

import { Suspense, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Package, Boxes, ShoppingBag, Loader2 } from 'lucide-react'
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth'
import { PageHeader } from '@/components/shared/page-header'
import { useEnrichedCategoryTree } from '@/hooks'
import { useCategoryMappingResolve } from '@/hooks/use-category-mapping'
import { selectMappingTarget, selectRelatedTargets, selectOneToManyTargets } from '@/lib/api/category-mapping'
import { CatalogBrowser } from '@/components/trading/trading-catalog-marketplace'

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      }
    >
      <CategoriesBrowser />
    </Suspense>
  )
}

function CategoriesBrowser() {
  // Canonical catalog data — the SAME cached bridge-tree response the locked
  // CatalogBrowser below consumes. Zero new requests from this page.
  const { data: enriched, isLoading, error } = useEnrichedCategoryTree()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // Deep link from the /trading category strip: ?category=<legacy-slug>.
  // Authority is the Phase 2 resolver (never slug equality, never name
  // similarity). The strip contract is preserved as-is; canonical
  // ?catalogCategory= URLs skip the resolver entirely.
  const selectedSlug = searchParams.get('category')
  const hasCatalogParam = !!searchParams.get('catalogCategory')
  const shouldResolve = !!selectedSlug && !hasCatalogParam
  const mappingQuery = useCategoryMappingResolve(shouldResolve ? selectedSlug : null)
  // EXACT-only selection; RELATED/ONE_TO_MANY/unmapped resolve to null
  // (clean browser, no fabrication) — see selectMappingTarget.
  const target = selectMappingTarget(mappingQuery.data)
  const mappingSettled = !shouldResolve || !mappingQuery.isLoading

  const catalogTree = useMemo(() => enriched?.catalogTree ?? [], [enriched])
  const totals = useMemo(() => {
    let subcategories = 0
    let items = 0
    for (const cat of catalogTree) {
      subcategories += cat.subcategories.length
      for (const sub of cat.subcategories) items += sub.itemCount ?? 0
    }
    return { categories: catalogTree.length, subcategories, items }
  }, [catalogTree])

  // Phase 3N (UX Option A): RELATED targets are suggestion-only. Resolved
  // with catalog display names from the already-loaded bridge tree (zero new
  // requests). Shown only when nothing is auto-selected.
  const relatedSuggestions = useMemo(() => {
    if (!mappingSettled || target || hasCatalogParam) return []
    return selectRelatedTargets(mappingQuery.data).map(t => ({
      ...t,
      catalogName: catalogTree.find(c => c.slug === t.catalogSlug)?.name ?? t.catalogSlug,
    }))
  }, [mappingQuery.data, mappingSettled, target, hasCatalogParam, catalogTree])

  // Phase 3P (UX Option A): ONE_TO_MANY chooser data. Explicit user choice
  // only — no preselect, no auto-redirect, no primary invention. Empty until
  // approved rows exist (currently zero in data).
  const chooserTargets = useMemo(() => {
    if (!mappingSettled || target || hasCatalogParam) return []
    return selectOneToManyTargets(mappingQuery.data).map(t => ({
      ...t,
      catalogName: catalogTree.find(c => c.slug === t.catalogSlug)?.name ?? t.catalogSlug,
    }))
  }, [mappingQuery.data, mappingSettled, target, hasCatalogParam, catalogTree])

  // Gate the browser mount until a resolver-backed selection is reflected in
  // the URL — otherwise the locked card would mount unselected (it reads the
  // selection prop at mount time only).
  const selectionReady =
    !selectedSlug ||
    hasCatalogParam ||
    (mappingSettled && (!target || searchParams.get('catalogCategory') === target.catalogSlug))

  useEffect(() => {
    if (!selectedSlug) return
    if (target && searchParams.get('catalogCategory') !== target.catalogSlug) {
      const sp = new URLSearchParams(searchParams.toString())
      sp.set('catalogCategory', target.catalogSlug)
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    }
    // The locked card's own category link doubles as a scroll anchor —
    // no component change required.
    if (target) {
      document
        .querySelector(`a[href="/trading?catalogCategory=${CSS.escape(target.catalogSlug)}"]`)
        ?.scrollIntoView({ block: 'start' })
    }
  }, [selectedSlug, target, searchParams, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-base)' }}>
        <p className="text-text-tertiary text-lg">Failed to load categories.</p>
        <p className="text-text-tertiary text-sm">Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)',
        }}
      />
      <div className="relative z-10">
        <PageHeader
          title="Browse All Categories"
          description="Navigate TRADINGO's complete business directory — 160 categories, 1,600 subcategories, a comprehensive product catalog."
        />

        {/* Canonical catalog statistics — derived live from the same
            bridge-tree response the browser below consumes. Catalog-master
            counts (NOT live marketplace listings). */}
        <section className="-mt-6 pb-8">
          <div className="container-main">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Categories', value: totals.categories.toLocaleString(), icon: Package },
                { label: 'Subcategories', value: totals.subcategories.toLocaleString(), icon: Boxes },
                { label: 'Total Catalog Items', value: totals.items.toLocaleString(), icon: ShoppingBag },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 surface-card-lg px-5 py-4 backdrop-blur-xl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(255,77,0,0.15)] to-[rgba(255,77,0,0.05)]">
                    <stat.icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Phase 3N (UX Option A): RELATED suggestion — explicit user choice
            only. Never auto-selects, never redirects, never claims equivalence.
            Navigates solely on click, via the existing canonical mechanism. */}
        {relatedSuggestions.length > 0 && (
          <section className="pb-8">
            <div className="container-main">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-text-primary">
                    Related canonical categor{relatedSuggestions.length > 1 ? 'ies' : 'y'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">
                    A narrower, related scope — not equivalent to the selected category.
                  </p>
                </div>
                {relatedSuggestions.map(s => (
                  <button
                    key={s.catalogSlug}
                    type="button"
                    onClick={() => {
                      const sp = new URLSearchParams(searchParams.toString())
                      sp.set('catalogCategory', s.catalogSlug)
                      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                  >
                    Explore related category: {s.catalogName} →
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Phase 3P (UX Option A): ONE_TO_MANY chooser. Renders ONLY when
            approved rows exist (currently zero). No preselected target, no
            auto-redirect — each button is an explicit user choice into the
            existing canonical flow. */}
        {chooserTargets.length > 0 && (
          <section className="pb-8" aria-label="Choose a related category">
            <div className="container-main">
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-text-primary">
                    Multiple related canonical categories
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">
                    Choose one explicitly — nothing is preselected and scopes are not equivalent.
                  </p>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {chooserTargets.map(t => (
                    <button
                      key={t.catalogSlug}
                      type="button"
                      onClick={() => {
                        const sp = new URLSearchParams(searchParams.toString())
                        sp.set('catalogCategory', t.catalogSlug)
                        router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
                      }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                    >
                      {t.catalogName} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Full catalog browser — relocated from /trading, same component and
            design. Its subcategory/product links target /trading canonically.
            Mounts only once selection is decided so a deep-linked card mounts
            already selected (the locked card reads selection at mount). */}
        <section className="pb-20">
          <div className="container-main">
            {selectionReady && <CatalogBrowser basePath="/trading" />}
          </div>
        </section>

        <ClaimYourGrowth />
      </div>
    </div>
  )
}

/* Legacy grid removed (Phase 1): the locked CatalogBrowser above is now the
   single category browsing system on this page. */
