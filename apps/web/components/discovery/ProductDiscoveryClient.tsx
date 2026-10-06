'use client'
import {
  useState, useCallback, useMemo, useRef, useEffect,
  type ReactNode,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlidersHorizontal, ChevronRight, ArrowUpDown,
  Sparkles, AlertTriangle, RefreshCw, IndianRupee, Star,
} from 'lucide-react'
import Link from 'next/link'
import SearchBar       from './SearchBar'
import FilterSidebar   from './FilterSidebar'
import QuickFilterBar  from './QuickFilterBar'
import NearToFarBanner from './NearToFarBanner'
import EngineBar       from './EngineBar'
import UnifiedCard     from './UnifiedCard'
import { ProductFullCard, ProductFullCardSkeleton } from '@/components/product/product-full-card'
import { ProfessionalCard } from '@/components/tradeserv/professional-card'
import CompanyCard from '@/components/company/CompanyCard'
import { fromDiscoveryResult } from '@/components/product/card-converters'
import { useCompareStore } from '@/store/compare-store'
import {
  SearchFilters, DiscoveryResult,
  GeoScope,
} from '@/types/discovery'
import { toast } from '@/components/ui/use-toast'
import { useProductSearch } from '@/hooks/use-discovery'
import { useTradeServSearchV2 } from '@/hooks/use-tradeserv'
import { useEnrichedCategoryTree } from '@/hooks'
import { resolveCanonicalTaxonomy } from '@/lib/api/discovery'
import { getCompanies } from '@/lib/api/companies'
import type { Company } from '@/lib/api/types'
import { aiSearchIntent } from '@/lib/api/ai-search'
import api from '@/lib/api/client'

const DEFAULT_FILTERS: SearchFilters = {
  q: '', mode: 'all', geoScope: 'pan_india',
  sortBy: 'relevance', page: 1, limit: 24,
}

const SORT_OPTIONS = [
  { value: 'relevance',   label: 'Most Relevant'  },
  { value: 'rating',      label: 'Top Rated'      },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'newest',      label: 'Newest First'   },
]

function BreadcrumbNav() {
  return (
    <nav className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3.5 py-2 text-xs backdrop-blur-md" aria-label="Breadcrumb">
      <Link href="/" className="text-text-secondary transition-colors hover:text-accent">
        Home
      </Link>
      <ChevronRight size={12} className="text-text-tertiary" />
      <span className="font-semibold text-text-primary">Products &amp; Services</span>
    </nav>
  )
}

export interface ProductDiscoveryClientProps {
  variant?: 'standalone' | 'embedded'
  basePath?: string
  /** Optional side rails rendered as true grid siblings of the product grid,
   * so their tops align exactly with the first card row (no offset hacks). */
  railLeft?: ReactNode
  railRight?: ReactNode
}

export default function ProductDiscoveryClient({
  variant = 'standalone',
  basePath = '/products',
  railLeft,
  railRight,
}: ProductDiscoveryClientProps = {}) {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const embedded      = variant === 'embedded'

  const barRef                    = useRef<HTMLDivElement>(null)
  const contentRef                = useRef<HTMLDivElement>(null)
  const [barTop, setBarTop]       = useState<number | null>(null)
  const [contentPad, setContentPad] = useState<number | null>(null)

  useEffect(() => {
    if (embedded) return
    const nav = document.querySelector('.glass-nav')
    const bar = barRef.current
    const content = contentRef.current
    const measure = () => {
      const navBottom = nav ? nav.getBoundingClientRect().bottom : 0
      const barHeight = bar ? bar.getBoundingClientRect().height : 0
      const contentTop = content ? content.getBoundingClientRect().top + window.scrollY : 0
      if (navBottom > 0) setBarTop(Math.round(navBottom + 20))
      if (barHeight > 0) setContentPad(Math.max(0, Math.round(navBottom + 20 + barHeight + 24 - contentTop)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (nav) ro.observe(nav)
    if (bar) ro.observe(bar)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [embedded])

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...DEFAULT_FILTERS,
    q:          searchParams.get('q')        || '',
    mode:       (searchParams.get('mode') as any) || 'all',
    categoryId: searchParams.get('category') || undefined,
    // Subcategory deep link from /categories (same old-tree slug namespace
    // as ?category=). Backend + hook contracts already support subCategory —
    // this only connects the existing URL param to the existing filter.
    subCategory: searchParams.get('subcategory') || undefined,
    // Phase 3B: canonical catalog slugs from locked CatalogBrowser links.
    // Resolved to backend IDs against the cached bridge tree below — never
    // sent raw, never hardcoded.
    catalogCategorySlug: searchParams.get('catalogCategory') || undefined,
    catalogSubcategorySlug: searchParams.get('catalogSubcategory') || undefined,
    sortBy:     (searchParams.get('sort') as any) || 'relevance',
    page:       Number(searchParams.get('page')) || 1,
  }))

  const [filterOpen, setFilterOpen] = useState(false)
  const [geoScope, setGeoScope]     = useState<GeoScope>('pan_india')

  // Phase 3B: canonical slug → ID resolution against the already-cached
  // bridge tree (PopularRail mounts the same key on /trading — zero new
  // requests there; one shared cached fetch on other surfaces).
  const { data: catalogTreeData } = useEnrichedCategoryTree()
  const canonical = useMemo(
    () => resolveCanonicalTaxonomy(
      catalogTreeData?.catalogTree ?? [],
      filters.catalogCategorySlug,
      filters.catalogSubcategorySlug,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogTreeData, filters.catalogCategorySlug, filters.catalogSubcategorySlug],
  )

  // ── P0-3 Step 8: buyer auto-taxonomy resolution ──────────────────────
  // (state hoisted above updateFilters so the D1 explicit-wins rule can
  // clear it; behavior otherwise identical to before.)
  const [autoTaxonomy, setAutoTaxonomy] = useState<{
    band: 'HIGH' | 'MEDIUM' | 'LOW'
    categoryId: string | null
    subcategoryId: string | null
    catalogItemId: string | null
    applied: boolean
    resolvedFor: string
  } | null>(null)
  // D2: generation guard — only the latest issued resolution may mutate
  // auto-taxonomy state; older completions are ignored.
  const taxonomyGenRef = useRef(0)

  const { items: compareItems, toggle: toggleCompare, clear: clearCompare } = useCompareStore()

  const { data: categories = [] } = useQuery({
    queryKey: ['discovery-categories'],
    queryFn: async () => {
      const res: any = await api.get('/categories?limit=160')
      return (res.data?.categories || res.data || []).map((c: any) => ({
        id: c.id, name: c.name, icon: c.icon || '',
      }))
    },
    staleTime: 300_000,
  })

  const syncUrl = useCallback((f: SearchFilters) => {
    const params = new URLSearchParams()
    if (f.q) params.set('q', f.q)
    if (f.mode && f.mode !== 'all') params.set('mode', f.mode)
    if (f.categoryId) params.set('category', f.categoryId)
    if (f.subCategory) params.set('subcategory', f.subCategory)
    if (f.catalogCategorySlug) params.set('catalogCategory', f.catalogCategorySlug)
    if (f.catalogSubcategorySlug) params.set('catalogSubcategory', f.catalogSubcategorySlug)
    if (f.sortBy && f.sortBy !== 'relevance') params.set('sort', f.sortBy)
    if (f.page && f.page > 1) params.set('page', String(f.page))
    const qs = params.toString()
    router.replace(`${basePath}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [router, basePath])

  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    const next = { ...filters, ...partial, page: partial.page ?? 1 }
    // An explicit legacy category pick replaces any canonical URL selection
    // (explicit new choice wins — mirrors the D1 rule below).
    if ('categoryId' in partial) {
      next.catalogCategorySlug = undefined
      next.catalogSubcategorySlug = undefined
    }
    setFilters(next)
    // D1: an explicit user-picked category outranks auto-applied AI taxonomy —
    // without this, the stale AI triple stays merged and the backend ANDs two
    // category systems into a silent false-empty. (Initial hydration starts
    // from a null auto-state, so this is a no-op there.)
    if ('categoryId' in partial || 'catalogCategoryId' in partial || 'subCategory' in partial) setAutoTaxonomy(null)
    syncUrl(next)
  }, [filters, syncUrl])

  // ── P0-3 Step 8: buyer auto-taxonomy resolution ──────────────────────
  // The buyer expresses intent naturally; the system resolves canonical
  // taxonomy automatically. Band routing (existing engine thresholds — no
  // invented numbers): HIGH = deterministic match → auto-applied filter
  // (visible + removable); MEDIUM = suggestion chip with Apply (optional);
  // LOW/unclassified = pure keyword search (never trapped by weak
  // classification). Runs once per query change; explicit category
  // navigation (buyer-picked) is respected and never overridden.
  const resolveTaxonomy = useCallback(async (q: string) => {
    const gen = ++taxonomyGenRef.current
    const current = () => taxonomyGenRef.current === gen
    if (!q.trim() || q.trim().length < 3) { if (current()) setAutoTaxonomy(null); return }
    try {
      const res = await aiSearchIntent({ query: q.trim() })
      // D2: a newer resolution has been issued since — this completion is
      // stale and must not mutate state (neither apply nor clear).
      if (!current()) return
      // Unwrap both shapes (axios response vs direct envelope) — the sidecar
      // contract is identical (Step 4).
      const envelope =
        (res as { data?: { taxonomy?: any } })?.data?.taxonomy
        ?? (res as { taxonomy?: any })?.taxonomy
      if (!envelope || !envelope.categoryId) { setAutoTaxonomy(null); return }
      // D3: the sidecar carries a domain type — a service-typed intent has no
      // valid application on product search (it can only honest-empty), so it
      // is dropped instead of chipped. Unknown/absent type preserves legacy
      // behavior.
      if (envelope.type === 'Service') { setAutoTaxonomy(null); return }
      const band = envelope.band === 'HIGH' || envelope.band === 'MEDIUM' ? envelope.band : 'LOW'
      setAutoTaxonomy({
        band,
        categoryId: envelope.categoryId,
        subcategoryId: envelope.subcategoryId ?? null,
        catalogItemId: envelope.catalogItemId ?? null,
        // HIGH auto-applies (deterministic — same rule the backend uses for
        // RFQ/bulk auto-classify); MEDIUM/LOW stay suggestions only.
        applied: band === 'HIGH',
        resolvedFor: q.trim(),
      })
    } catch {
      // Intent resolution is best-effort — keyword search continues normally.
      // (Generation-guarded like every other mutation in this resolver.)
      if (current()) setAutoTaxonomy(null)
    }
  }, [])

  // ── O-2 functional modes: each tab maps to the existing retrieval surface
  // proven for its entity — products → product search; services → TradeServ
  // V2 (APPROVED-scoped); companies → company directory. No new backend, no
  // new concepts; AI auto-taxonomy constrains product retrieval only.
  // Unknown mode values (e.g. hand-edited URLs) fall back to 'all' rather
  // than landing on an unintended surface.
  const activeMode = (['all', 'products', 'services', 'companies'] as const).includes(filters.mode as any)
    ? filters.mode
    : 'all'
  const isProductMode = activeMode === 'all' || activeMode === 'products'

  const appliedTaxonomy = autoTaxonomy?.applied && autoTaxonomy.categoryId && isProductMode
    ? {
        catalogCategoryId: autoTaxonomy.categoryId,
        catalogSubcategoryId: autoTaxonomy.subcategoryId ?? undefined,
        catalogItemId: autoTaxonomy.catalogItemId ?? undefined,
      }
    : undefined

  useEffect(() => {
    // Skip when the buyer navigated via an explicit category (their choice
    // outranks auto-resolution) or when a taxonomy filter is already active.
    if (filters.categoryId || filters.catalogCategoryId || filters.subCategory || canonical.hasCanonicalParams) { setAutoTaxonomy(null); return }
    resolveTaxonomy(filters.q || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q])

  // Phase 3B precedence: an explicit canonical URL selection controls final
  // filtering. Legacy categoryId/subCategory are dropped from the request so
  // two taxonomy systems are never ANDed into a false-empty; the AI
  // auto-taxonomy is likewise suppressed (explicit navigation wins).
  const searchFilters = useMemo(() => {
    if (canonical.hasCanonicalParams) {
      const { categoryId: _dropCat, subCategory: _dropSub, ...rest } = filters
      void _dropCat
      void _dropSub
      return {
        ...rest,
        categoryId: undefined,
        subCategory: undefined,
        catalogCategoryId: canonical.categoryId,
        catalogSubcategoryId: canonical.subcategoryId,
      }
    }
    return appliedTaxonomy ? { ...filters, ...appliedTaxonomy } : filters
  }, [filters, appliedTaxonomy, canonical])
  // ── end P0-3 Step 8 ───────────────────────────────────────────────────

  const { data, isLoading, isError, refetch, isRefetching } = useProductSearch(searchFilters)

  // Services tab: existing TradeServ V2 retrieval (APPROVED-scoped server-side).
  // Phase 3B: same canonical selection flows into services via the existing
  // TradeServ V2 contract (hook + API already accept these filters).
  const servicesQuery = useTradeServSearchV2(
    {
      query: filters.q || undefined,
      page: filters.page || 1,
      limit: 24,
      ...(canonical.hasCanonicalParams
        ? {
            catalogCategoryId: canonical.categoryId,
            catalogSubcategoryId: canonical.subcategoryId,
          }
        : {}),
    },
    activeMode === 'services',
  )
  const services = servicesQuery.data?.data ?? []
  const servicesMeta = servicesQuery.data?.meta

  // Companies tab: existing company directory retrieval.
  const companiesQuery = useQuery({
    queryKey: ['companies', 'discovery', filters.q || '', filters.page || 1],
    queryFn: () => getCompanies({ search: filters.q || undefined, page: filters.page || 1, limit: 24 }),
    enabled: activeMode === 'companies',
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
  const companies = (companiesQuery.data?.data ?? []) as Company[]
  const companiesMeta = companiesQuery.data

  const resetFilters = () => {
    const defaults = { ...DEFAULT_FILTERS }
    setFilters(defaults)
    setGeoScope('pan_india')
    setAutoTaxonomy(null)
    syncUrl(defaults)
  }

  const handleCompareToggle = useCallback((item: DiscoveryResult) => {
    if (!compareItems.some(c => c._id === item.id) && compareItems.length >= 4) {
      toast({ title: 'Max 4 items to compare', variant: 'destructive' })
      return
    }
    const model = fromDiscoveryResult(item)
    toggleCompare({
      _id: model.id,
      slug: model.slug,
      title: model.title,
      images: model.images?.length ? model.images : ['/placeholder-product.jpg'],
      price: model.price,
      unit: model.unit,
      rating: model.rating,
      reviewCount: model.reviewCount,
      moq: model.moq,
      inStock: model.inStock,
      seller: { businessName: model.seller.name, slug: model.seller.slug, isVerified: model.seller.isVerified, trustScore: model.seller.trustScore, city: model.seller.city || '' },
      deliveryEta: model.deliveryEta,
    })
  }, [compareItems, toggleCompare])

  const results = data?.results ?? []
  const total   = data?.total ?? 0

  const geoCounts = useMemo(() => {
    if (!data?.geoBreakdown) return {}
    return data.geoBreakdown.reduce((acc, g) => {
      const labels: Record<number,string> = {
        1:'near_me',2:'city',3:'district',
        4:'state',5:'pan_india',6:'global',
      }
      acc[labels[g.ring]] = g.count
      return acc
    }, {} as Record<string,number>)
  }, [data?.geoBreakdown])

  return (
    <>
      <div className={`${embedded ? 'absolute inset-0' : 'fixed inset-0'} pointer-events-none overflow-hidden`} style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #9B5DE518, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3D8BFF18, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div ref={barRef} className={`${embedded ? 'relative' : 'fixed left-0 right-0 z-40'} py-1.5 px-4 bg-surface/95 border-b border-border`}
        style={embedded ? { backdropFilter: 'blur(24px)' } : {
          top: barTop !== null ? `${barTop}px` : 'calc(var(--nav-h) + 20px)',
          backdropFilter: 'blur(24px)',
        }}>
        <div className="max-w-[1600px] mx-auto">
          <div className="relative">
            <SearchBar
              initialFilters={filters}
              onSearch={updateFilters}
              isLoading={isLoading}
              geoBanner={
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <NearToFarBanner
                      activeScope={geoScope}
                      counts={geoCounts}
                      onScopeChange={s => {
                        setGeoScope(s)
                        updateFilters({ geoScope: s })
                      }}
                    />
                  </div>
                  <div className="hidden lg:flex flex-shrink-0">
                    <QuickFilterBar
                      filters={filters}
                      categories={categories}
                      onChange={updateFilters}
                      onReset={resetFilters}
                    />
                  </div>
                  <div className="hidden 2xl:block flex-shrink-0">
                    <BreadcrumbNav />
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>

      <div ref={contentRef} className="min-h-screen" style={embedded ? undefined : { paddingTop: contentPad !== null ? `${contentPad}px` : 'calc(var(--nav-h) + 91px)' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-1">

        <h1 className="sr-only">
          Find, Compare &amp; Buy Products and Services
        </h1>

        <div className="mb-2 rounded-2xl border border-border px-4 py-2.5"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 55%), radial-gradient(circle at 0% 0%, rgba(255,77,0,0.07), transparent 30%), var(--bg-elevated)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
          <div className="flex flex-nowrap items-center gap-x-3 overflow-x-auto nav-scroll-hide">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-accent">
              <Sparkles size={11} className="flex-shrink-0" />
              Discovery Engine
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[9px] font-medium text-text-tertiary whitespace-nowrap"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <Sparkles size={10} className="text-accent flex-shrink-0" />
              Powered by AI — supports Hindi, English, Hinglish
            </span>

            <div className="ml-auto flex flex-nowrap items-center gap-2 shrink-0">
              <div className="hidden md:flex gap-1 p-1 rounded-full"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                {(['all','products','services','companies'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => updateFilters({ mode: m })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize transition-all duration-200 ${
                      filters.mode===m
                        ? 'bg-gradient-to-r from-accent to-accent-amber text-btn-primary-text shadow-lg'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    style={filters.mode===m ? { boxShadow: '0 4px 14px rgba(255,77,0,0.35)' } : undefined}>
                    {m === 'all' ? 'All Results' : m.charAt(0).toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>

              {total > 0 && !isLoading && (
                <div className="hidden sm:flex shrink-0 items-center gap-2 px-2 py-1 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <p className="text-text-secondary text-[11px] whitespace-nowrap">
                    <strong className="text-accent font-black">{total.toLocaleString()}</strong>{' '}
                    results
                    {data?.meta?.corrected && (
                      <span className="text-text-tertiary"> · <strong>{data.meta.corrected}</strong></span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-full bg-surface border border-border transition-all"
                style={filters.sortBy && filters.sortBy !== 'relevance' ? { borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' } : undefined}>
                <ArrowUpDown size={12} className="text-accent flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary hidden xl:inline">Sort</span>
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={e => updateFilters({ sortBy: e.target.value as any })}
                  className="bg-transparent text-text-secondary text-[11px] font-semibold focus:outline-none cursor-pointer appearance-none"
                  style={{ direction: 'rtl' }}>
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}
                      style={{ background: 'var(--bg-base)' }}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-full bg-surface border border-border transition-all"
                style={filters.minPrice || filters.maxPrice ? { borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' } : undefined}>
                <IndianRupee size={12} className="text-accent flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary hidden xl:inline">Price</span>
                <select
                  value={`${filters.minPrice ?? ''}-${filters.maxPrice ?? ''}`}
                  onChange={e => {
                    const [min, max] = e.target.value.split('-')
                    updateFilters({
                      minPrice: min ? Number(min) : undefined,
                      maxPrice: max ? Number(max) : undefined,
                    })
                  }}
                  className="bg-transparent text-text-secondary text-[11px] font-semibold focus:outline-none cursor-pointer appearance-none"
                  style={{ direction: 'rtl' }}>
                  <option value="-" style={{ background: 'var(--bg-base)' }}>Any Price</option>
                  <option value="-1000" style={{ background: 'var(--bg-base)' }}>Under ₹1K</option>
                  <option value="1000-10000" style={{ background: 'var(--bg-base)' }}>₹1K – ₹10K</option>
                  <option value="10000-50000" style={{ background: 'var(--bg-base)' }}>₹10K – ₹50K</option>
                  <option value="50000-" style={{ background: 'var(--bg-base)' }}>₹50K +</option>
                </select>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-full bg-surface border border-border transition-all"
                style={filters.topRated ? { borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' } : undefined}>
                <Star size={12} className="text-accent flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary hidden xl:inline">Rating</span>
                <select
                  value={filters.topRated ? '4.5' : ''}
                  onChange={e => updateFilters({ topRated: e.target.value === '4.5' || undefined })}
                  className="bg-transparent text-text-secondary text-[11px] font-semibold focus:outline-none cursor-pointer appearance-none"
                  style={{ direction: 'rtl' }}>
                  <option value="" style={{ background: 'var(--bg-base)' }}>Any Rating</option>
                  <option value="4.5" style={{ background: 'var(--bg-base)' }}>4.5★ &amp; above</option>
                </select>
              </div>

              <button onClick={() => setFilterOpen(true)}
                className="flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold transition-all lg:hidden bg-surface border-border text-text-primary">
                <SlidersHorizontal size={13} />
                Filters
              </button>
            </div>
          </div>
          <div className="mt-2 h-[3px] w-14 rounded-full bg-gradient-to-r from-accent via-accent-amber to-transparent" />
        </div>

        <div className="mb-2">
          <EngineBar />
        </div>

        {/* P0-3 Step 8: auto-taxonomy state — always visible, always removable.
            HIGH = auto-applied (chip with Remove); MEDIUM = suggestion
            (Apply/Dismiss). The buyer is never silently locked in.
            O-2: product-taxonomy chip renders on product surfaces only. */}
        {isProductMode && autoTaxonomy && autoTaxonomy.categoryId && (
          <div className="mb-2 flex flex-wrap items-center gap-2" role="status" aria-label="Automatic category resolution">
            {autoTaxonomy.applied ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-accent">
                <Sparkles size={12} className="flex-shrink-0" />
                Auto-matched to your search
                <button
                  type="button"
                  onClick={() => setAutoTaxonomy(null)}
                  className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary hover:text-text-primary bg-surface"
                  aria-label="Remove automatic category filter"
                >
                  Remove
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary">
                <Sparkles size={12} className="flex-shrink-0 text-accent" />
                Related category detected
                <button
                  type="button"
                  onClick={() => setAutoTaxonomy(prev => (prev ? { ...prev, applied: true } : prev))}
                  className="ml-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/20"
                >
                  Apply filter
                </button>
                <button
                  type="button"
                  onClick={() => setAutoTaxonomy(null)}
                  className="rounded-full px-1.5 py-0.5 text-[10px] text-text-tertiary hover:text-text-primary"
                  aria-label="Dismiss category suggestion"
                >
                  Dismiss
                </button>
              </span>
            )}
          </div>
        )}

        <FilterSidebar
          filters={filters}
          categories={categories}
          onChange={updateFilters}
          onReset={resetFilters}
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />

        <div>
          {isError && (
              <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm bg-status-error/10 border border-status-error/25">
                <AlertTriangle size={16} className="text-status-error flex-shrink-0" />
                <span className="text-text-secondary">
                  We couldn&apos;t load results. Please try again.
                </span>
                <button onClick={() => refetch()}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border-border text-text-primary transition-all hover:border-accent/30 flex-shrink-0">
                  <RefreshCw size={12} className={isRefetching ? 'animate-spin' : ''} />
                  Retry
                </button>
              </div>
            )}

            {data?.meta?.corrected && (
              <div className="mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
                style={{ background: 'var(--accent-08)', border: '1px solid var(--accent-25)' }}>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-text-secondary">
                  Showing results for
                  <strong className="text-text-primary mx-1">&quot;{data.meta.corrected}&quot;</strong>
                </span>
              </div>
            )}

            {/* O-2 functional modes: the product surface below is unchanged;
                services/companies branches follow after its pagination. */}
            {isProductMode ? (<>
            {!isLoading && data && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">{'\uD83D\uDD0D'}</div>
                <h3 className="text-text-primary font-bold text-xl mb-2">
                  {data.total === 0 ? 'No products listed yet' : 'No results found'}
                </h3>
                <p className="text-text-tertiary text-sm max-w-sm">
                  {data.total === 0
                    ? 'Products listed by sellers on TRADINGO will appear here. Explore the directory sections above to discover companies.'
                    : 'Try different keywords, remove filters, or expand the geo scope to Pan India.'}
                </p>
                <button onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-btn-primary-text">
                  Clear All Filters
                </button>
              </div>
            )}

            <div className={
              !railLeft && !railRight ? undefined
              : railLeft && railRight ? 'grid grid-cols-1 gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]'
              : railLeft ? 'grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]'
              : 'grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]'
            }>
              {railLeft ? <aside className="min-w-0" aria-label="Products in All Categories">{railLeft}</aside> : null}
              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => <ProductFullCardSkeleton key={i} />)
                : results.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={item.type === 'product' ? 'sm:col-span-2' : undefined}
                    >
                      {item.type === 'product' ? (
                        <ProductFullCard product={fromDiscoveryResult(item)} />
                      ) : (
                        <UnifiedCard
                          item={item}
                          detailBasePath={basePath}
                          onCompare={() => handleCompareToggle(item)}
                          inCompare={compareItems.some(c => c._id === item.id)}
                        />
                      )}
                    </motion.div>
                  ))
              }
              </div>
              {railRight ? <aside className="min-w-0">{railRight}</aside> : null}
            </div>

            {data && data.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => updateFilters({ page: (filters.page||1) - 1 })}
                  disabled={(filters.page||1) <= 1}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30 bg-surface border-border text-text-primary">
                  Previous
                </button>
                <span className="text-text-tertiary text-sm">
                  Page {filters.page||1} of {data.pages}
                </span>
                <button
                  onClick={() => updateFilters({ page: (filters.page||1) + 1 })}
                  disabled={(filters.page||1) >= data.pages}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30 bg-accent text-btn-primary-text">
                  Next
                </button>
              </div>
            )}
            </>) : activeMode === 'services' ? (<>
            {servicesQuery.isError && (
              <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm bg-status-error/10 border border-status-error/25">
                <AlertTriangle size={16} className="text-status-error flex-shrink-0" />
                <span className="text-text-secondary">
                  We couldn&apos;t load services. Please try again.
                </span>
                <button onClick={() => servicesQuery.refetch()}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border-border text-text-primary transition-all hover:border-accent/30 flex-shrink-0">
                  <RefreshCw size={12} className={servicesQuery.isRefetching ? 'animate-spin' : ''} />
                  Retry
                </button>
              </div>
            )}
            {!servicesQuery.isLoading && services.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">{'\uD83D\uDD0D'}</div>
                <h3 className="text-text-primary font-bold text-xl mb-2">
                  No services found
                </h3>
                <p className="text-text-tertiary text-sm max-w-sm">
                  Try different keywords, or explore verified professionals on TradeServ.
                </p>
                <Link href="/tradeserv"
                  className="mt-5 px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-btn-primary-text">
                  Browse TradeServ
                </Link>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {servicesQuery.isLoading
                ? Array.from({ length: 3 }).map((_, i) => <ProductFullCardSkeleton key={i} />)
                : services.map((s: any, i: number) => (
                    <motion.div
                      key={s.slug ?? s.id ?? i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProfessionalCard profile={s} />
                    </motion.div>
                  ))
              }
            </div>
            {servicesMeta && servicesMeta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => updateFilters({ page: (filters.page||1) - 1 })}
                  disabled={(filters.page||1) <= 1}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30 bg-surface border-border text-text-primary">
                  Previous
                </button>
                <span className="text-text-tertiary text-sm">
                  Page {filters.page||1} of {servicesMeta.totalPages}
                </span>
                <button
                  onClick={() => updateFilters({ page: (filters.page||1) + 1 })}
                  disabled={(filters.page||1) >= servicesMeta.totalPages}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30 bg-accent text-btn-primary-text">
                  Next
                </button>
              </div>
            )}
            </>) : (<>
            {companiesQuery.isError && (
              <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm bg-status-error/10 border border-status-error/25">
                <AlertTriangle size={16} className="text-status-error flex-shrink-0" />
                <span className="text-text-secondary">
                  We couldn&apos;t load companies. Please try again.
                </span>
                <button onClick={() => companiesQuery.refetch()}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border-border text-text-primary transition-all hover:border-accent/30 flex-shrink-0">
                  <RefreshCw size={12} className={companiesQuery.isRefetching ? 'animate-spin' : ''} />
                  Retry
                </button>
              </div>
            )}
            {!companiesQuery.isLoading && companies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">{'\uD83D\uDD0D'}</div>
                <h3 className="text-text-primary font-bold text-xl mb-2">
                  No companies found
                </h3>
                <p className="text-text-tertiary text-sm max-w-sm">
                  Try different keywords, or browse the company directory.
                </p>
                <Link href="/companies"
                  className="mt-5 px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-btn-primary-text">
                  Browse Companies
                </Link>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {companiesQuery.isLoading
                ? Array.from({ length: 3 }).map((_, i) => <ProductFullCardSkeleton key={i} />)
                : companies.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CompanyCard company={{
                        id: c.id,
                        name: c.name,
                        slug: (c as any).slug ?? c.id,
                        logo: c.logo ?? undefined,
                        description: c.description ?? undefined,
                        city: c.city ?? '',
                        state: c.state ?? '',
                        categories: (c.categories ?? []).filter((x): x is string => typeof x === 'string'),
                        isVerified: c.verificationStatus === 'verified',
                        trustScore: c.trustScore ?? 0,
                        rating: c.rating ?? 0,
                        reviewCount: c.reviewCount ?? 0,
                      }} index={i} />
                    </motion.div>
                  ))
              }
            </div>
            {companiesMeta && companiesMeta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => updateFilters({ page: (filters.page||1) - 1 })}
                  disabled={(filters.page||1) <= 1}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30 bg-surface border-border text-text-primary">
                  Previous
                </button>
                <span className="text-text-tertiary text-sm">
                  Page {filters.page||1} of {companiesMeta.totalPages}
                </span>
                <button
                  onClick={() => updateFilters({ page: (filters.page||1) + 1 })}
                  disabled={(filters.page||1) >= companiesMeta.totalPages}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30 bg-accent text-btn-primary-text">
                  Next
                </button>
              </div>
            )}
            </>)}
          </div>
      </div>

      <AnimatePresence>
        {compareItems.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className={`${embedded ? 'sticky bottom-0 left-0 right-0 z-40' : 'fixed bottom-0 left-0 right-0 z-50'} py-3 px-4 bg-surface border-t border-border`}
            style={{ backdropFilter: 'blur(20px)' }}>
            <div className="max-w-[1600px] mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-text-tertiary flex-shrink-0">
                Compare ({compareItems.length}/4)
              </span>
              {compareItems.map(item => (
                <div key={item._id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0 bg-surface border-border">
                  <span className="text-text-primary text-xs">{item.title}</span>
                  <button onClick={() => toggleCompare(item)}
                    className="text-text-tertiary hover:text-primary ml-1">X</button>
                </div>
              ))}
              <div className="ml-auto flex gap-2 flex-shrink-0">
                <button onClick={() => clearCompare()}
                  className="text-xs text-text-tertiary hover:text-text-secondary">Clear</button>
                <button
                  onClick={() => router.push(`/compare?ids=${compareItems.map(i=>i._id).join(',')}`)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-accent text-btn-primary-text">
                  Compare Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}
