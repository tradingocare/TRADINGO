'use client'
import {
  useState, useCallback, useMemo,
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
import { fromDiscoveryResult } from '@/components/product/card-converters'
import { useCompareStore } from '@/store/compare-store'
import {
  SearchFilters, DiscoveryResult,
  GeoScope,
} from '@/types/discovery'
import { toast } from '@/components/ui/use-toast'
import { useProductSearch } from '@/hooks/use-discovery'
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

export default function ProductDiscoveryClient() {
  const searchParams  = useSearchParams()
  const router        = useRouter()

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...DEFAULT_FILTERS,
    q:          searchParams.get('q')        || '',
    mode:       (searchParams.get('mode') as any) || 'all',
    categoryId: searchParams.get('category') || undefined,
    sortBy:     (searchParams.get('sort') as any) || 'relevance',
    page:       Number(searchParams.get('page')) || 1,
  }))

  const [filterOpen, setFilterOpen] = useState(false)
  const [geoScope, setGeoScope]     = useState<GeoScope>('pan_india')

  const { items: compareItems, toggle: toggleCompare, clear: clearCompare } = useCompareStore()

  const { data, isLoading, isError, refetch, isRefetching } = useProductSearch(filters)

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
    if (f.sortBy && f.sortBy !== 'relevance') params.set('sort', f.sortBy)
    if (f.page && f.page > 1) params.set('page', String(f.page))
    const qs = params.toString()
    router.replace(`/products${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [router])

  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    const next = { ...filters, ...partial, page: partial.page ?? 1 }
    setFilters(next)
    syncUrl(next)
  }, [filters, syncUrl])

  const resetFilters = () => {
    const defaults = { ...DEFAULT_FILTERS }
    setFilters(defaults)
    setGeoScope('pan_india')
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #9B5DE518, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3D8BFF18, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="fixed left-0 right-0 z-40 py-1.5 px-4 bg-surface/95 border-b border-border"
        style={{
          top: '84px',
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

      <div className="min-h-screen" style={{ paddingTop: '155px' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-1">

        <div className="mb-2 rounded-2xl border border-border px-4 py-2.5"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 55%), radial-gradient(circle at 0% 0%, rgba(255,77,0,0.07), transparent 30%), var(--bg-elevated)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent">
              <Sparkles size={11} className="flex-shrink-0" />
              Discovery Engine
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-medium text-text-tertiary whitespace-nowrap"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <Sparkles size={10} className="text-accent flex-shrink-0" />
              Powered by AI — supports Hindi, English, Hinglish
            </span>

            <div className="ml-auto flex items-center gap-2.5 flex-wrap">
              <div className="hidden md:flex gap-1 p-1 rounded-full"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                {(['all','products','services','companies'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => updateFilters({ mode: m })}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize transition-all duration-200 ${
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
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <p className="text-text-secondary text-xs whitespace-nowrap">
                    <strong className="text-accent font-black">{total.toLocaleString()}</strong>{' '}
                    results
                    {data?.meta?.corrected && (
                      <span className="text-text-tertiary"> · <strong>{data.meta.corrected}</strong></span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border transition-all"
                style={filters.sortBy && filters.sortBy !== 'relevance' ? { borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' } : undefined}>
                <ArrowUpDown size={12} className="text-accent flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary hidden xl:inline">Sort</span>
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={e => updateFilters({ sortBy: e.target.value as any })}
                  className="bg-transparent text-text-secondary text-xs font-semibold focus:outline-none cursor-pointer appearance-none"
                  style={{ direction: 'rtl' }}>
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}
                      style={{ background: 'var(--bg-base)' }}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border transition-all"
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
                  className="bg-transparent text-text-secondary text-xs font-semibold focus:outline-none cursor-pointer appearance-none"
                  style={{ direction: 'rtl' }}>
                  <option value="-" style={{ background: 'var(--bg-base)' }}>Any Price</option>
                  <option value="-1000" style={{ background: 'var(--bg-base)' }}>Under ₹1K</option>
                  <option value="1000-10000" style={{ background: 'var(--bg-base)' }}>₹1K – ₹10K</option>
                  <option value="10000-50000" style={{ background: 'var(--bg-base)' }}>₹10K – ₹50K</option>
                  <option value="50000-" style={{ background: 'var(--bg-base)' }}>₹50K +</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border transition-all"
                style={filters.topRated ? { borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' } : undefined}>
                <Star size={12} className="text-accent flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary hidden xl:inline">Rating</span>
                <select
                  value={filters.topRated ? '4.5' : ''}
                  onChange={e => updateFilters({ topRated: e.target.value === '4.5' || undefined })}
                  className="bg-transparent text-text-secondary text-xs font-semibold focus:outline-none cursor-pointer appearance-none"
                  style={{ direction: 'rtl' }}>
                  <option value="" style={{ background: 'var(--bg-base)' }}>Any Rating</option>
                  <option value="4.5" style={{ background: 'var(--bg-base)' }}>4.5★ &amp; above</option>
                </select>
              </div>

              <button onClick={() => setFilterOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all lg:hidden bg-surface border-border text-text-primary">
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

            {!isLoading && data && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">{'\uD83D\uDD0D'}</div>
                <h3 className="text-text-primary font-bold text-xl mb-2">No results found</h3>
                <p className="text-text-tertiary text-sm max-w-sm">
                  Try different keywords, remove filters, or expand the geo scope to Pan India.
                </p>
                <button onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-btn-primary-text">
                  Clear All Filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => <ProductFullCardSkeleton key={i} />)
                : results.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {item.type === 'product' ? (
                        <ProductFullCard product={fromDiscoveryResult(item)} />
                      ) : (
                        <UnifiedCard
                          item={item}
                          onCompare={() => handleCompareToggle(item)}
                          inCompare={compareItems.some(c => c._id === item.id)}
                        />
                      )}
                    </motion.div>
                  ))
              }
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
          </div>
      </div>

      <AnimatePresence>
        {compareItems.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 py-3 px-4 bg-surface border-t border-border"
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
