'use client'
import {
  useState, useEffect, useCallback,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence }    from 'framer-motion'
import {
  SlidersHorizontal, Grid, List,
  Sparkles,
} from 'lucide-react'
import SearchBar       from './SearchBar'
import FilterSidebar   from './FilterSidebar'
import NearToFarBanner from './NearToFarBanner'
import EngineBar       from './EngineBar'
import UnifiedCard     from './UnifiedCard'
import ProductCard from '@/components/product/product-card'
import CompactProductCard from '@/components/product/compact-product-card'
import type { ProductCardData } from '@/components/product/product-card'
import { useCompareStore } from '@/store/compare-store'
import type { CompareProduct } from '@/store/compare-store'
import {
  SearchFilters, DiscoveryResult, DiscoveryResponse,
  GeoScope,
} from '@/types/discovery'
import api from '@/lib/api/client'
import { toast }         from '@/components/ui/use-toast'
import { CATALOG_CATEGORIES } from '@/data/catalog-data'
import {
  MASTER_PRODUCTS, MASTER_SERVICES,
} from '@/data/master-data'

const REAL_CATEGORIES = CATALOG_CATEGORIES.map(c => ({
  id: c.id, name: c.name, icon: c.icon,
}))

function toProductCardData(dr: DiscoveryResult): ProductCardData {
  return {
    _id: dr.id,
    id: dr.id,
    slug: dr.slug,
    title: dr.name,
    images: dr.images?.length ? dr.images : ['/placeholder-product.jpg'],
    categoryName: dr.categoryName,
    subCategory: dr.subCategory ?? '',
    price: dr.price ?? 0,
    originalPrice: dr.originalPrice,
    unit: dr.unit ?? 'unit',
    rating: dr.rating,
    reviewCount: dr.reviewCount,
    deliveryEta: dr.deliveryEta,
    moq: dr.moq ?? 1,
    stockQty: dr.stockQty,
    inStock: dr.inStock ?? true,
    priceSlabs: dr.priceSlabs,
    seller: {
      _id: dr.seller.id,
      id: dr.seller.id,
      slug: dr.seller.slug,
      businessName: dr.seller.name,
      isVerified: dr.isVerified,
      isTradgoElite: dr.seller.isTradgoElite,
      trustScore: dr.trustScore,
      avgResponseTime: dr.responseTime,
      city: dr.city,
      distanceKm: dr.distanceKm,
    },
  }
}

function toCompareProduct(dr: DiscoveryResult): CompareProduct {
  return {
    _id: dr.id,
    slug: dr.slug,
    title: dr.name,
    images: dr.images?.length ? dr.images : ['/placeholder-product.jpg'],
    price: dr.price ?? 0,
    unit: dr.unit ?? 'unit',
    rating: dr.rating,
    reviewCount: dr.reviewCount,
    moq: dr.moq ?? 1,
    inStock: dr.inStock ?? true,
    seller: {
      businessName: dr.seller.name,
      slug: dr.seller.slug,
      isVerified: dr.isVerified,
      trustScore: dr.trustScore,
      city: dr.city,
    },
    deliveryEta: dr.deliveryEta,
    stockQty: dr.stockQty,
  }
}

let _cachedResults: DiscoveryResult[] | null = null
function buildResults(): DiscoveryResult[] {
  if (_cachedResults) return _cachedResults
  const results: DiscoveryResult[] = [
    ...MASTER_PRODUCTS.map(p => ({
      id: p.id, type: 'product' as const, name: p.name, slug: p.slug,
      description: p.description, images: [p.image],
      categoryName: p.categoryName, subCategory: p.subCategory,
      isVerified: p.seller.isVerified, trustScore: p.seller.trustScore,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)), reviewCount: Math.floor(Math.random() * 900) + 100,
      responseTime: ['< 1 hr', '< 2 hrs', '< 4 hrs', '< 24 hrs'][Math.floor(Math.random() * 4)],
      geoRing: p.geoRing, city: p.city, state: p.state,
      distanceKm: Math.floor(Math.random() * 500) + 10,
      seller: { id: p.seller.id, name: p.seller.name, isVerified: p.seller.isVerified, trustScore: p.seller.trustScore, isTradgoElite: p.seller.isTradgoElite },
      price: p.minPrice, originalPrice: Math.floor(p.maxPrice * 1.15),
      unit: p.unit, moq: p.moq, inStock: p.inStock,
      deliveryEta: `${15 + Math.floor(Math.random() * 20)}-${30 + Math.floor(Math.random() * 20)} days`,
      gocashEarn: Math.floor(p.minPrice * 0.01),
    })),
    ...MASTER_SERVICES.map(s => ({
      id: s.id, type: 'service' as const, name: s.name, slug: s.slug,
      description: s.description, images: [s.image],
      categoryName: s.categoryName, subCategory: s.subCategory,
      isVerified: s.seller.isVerified, trustScore: s.seller.trustScore,
      rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)), reviewCount: Math.floor(Math.random() * 600) + 50,
      responseTime: ['< 15 min', '< 30 min', '< 1 hr'][Math.floor(Math.random() * 3)],
      geoRing: s.geoRing, city: s.city, state: s.state,
      seller: { id: s.seller.id, name: s.seller.name, isVerified: s.seller.isVerified, trustScore: s.seller.trustScore, isTradgoElite: s.seller.isTradgoElite },
      pricingModel: s.pricingModel, price: s.price, unit: s.unit,
      coverageArea: s.coverageArea,
      gocashEarn: s.price > 5000 ? Math.floor(s.price * 0.02) : undefined,
    })),
  ]
  _cachedResults = results
  return results
}

const DEFAULT_FILTERS: SearchFilters = {
  q: '', mode: 'all', geoScope: 'pan_india',
  sortBy: 'relevance', page: 1, limit: 24,
}

function ResultSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="aspect-[4/3] bg-white/5" />
      <div className="p-4 space-y-2.5">
        <div className="h-2 bg-white/5 rounded w-1/3" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="h-7 bg-white/5 rounded w-1/2" />
        <div className="h-8 bg-white/5 rounded" />
      </div>
    </div>
  )
}

export default function ProductDiscoveryClient() {
  const searchParams  = useSearchParams()
  const router        = useRouter()

  const [filters, setFilters]       = useState<SearchFilters>(() => ({
    ...DEFAULT_FILTERS,
    q:          searchParams.get('q')        || '',
    mode:       (searchParams.get('mode') as any) || 'all',
    categoryId: searchParams.get('category') || undefined,
  }))

  const [data, setData]             = useState<DiscoveryResponse | null>(() => {
    const results = buildResults()
    return {
      results,
      total: results.length,
      page: 1,
      pages: 1,
      geoBreakdown: [
        { ring: 1, label: 'My Area', count: results.filter(r => r.geoRing <= 2).length },
        { ring: 2, label: 'City', count: results.filter(r => r.geoRing === 3).length },
        { ring: 3, label: 'District', count: results.filter(r => r.geoRing === 3).length },
        { ring: 4, label: 'State', count: results.filter(r => r.geoRing === 4).length },
        { ring: 5, label: 'Pan India', count: results.filter(r => r.geoRing === 5).length },
        { ring: 6, label: 'Global', count: results.filter(r => r.geoRing === 6).length },
      ],
      meta: { query: '', language: 'en', corrected: '', fromCache: false, responseMs: 0 },
    } as DiscoveryResponse
  })
  const [loading, setLoading]       = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode]     = useState<'grid'|'list'>('list')
  const [categories, setCategories] = useState<any[]>(REAL_CATEGORIES)
  const [geoScope, setGeoScope]     = useState<GeoScope>('pan_india')

  const { items: compareItems, toggle: toggleCompare, clear: clearCompare } = useCompareStore()

  useEffect(() => {
    api.get('/v1/categories?limit=160')
      .then((r: any) => setCategories(r.data?.categories || r.data || REAL_CATEGORIES))
      .catch(() => { /* using REAL_CATEGORIES */ })
  }, [])

  const doSearch = useCallback(async (f: SearchFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(f).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null)
          params.set(k, String(v))
      })

      const res: any = await api.get(`/v1/search-ai/query?${params}`)
      const d = res.data || res
      setData(d)
    } catch {
      setData(prev => prev || {
        results: [],
        total: 0, page: 1, pages: 1,
        geoBreakdown: [],
        meta: { query: f.q, language: 'en', corrected: '', fromCache: false, responseMs: 0 },
      } as DiscoveryResponse)
      toast({ title: 'Backend API unavailable — using master data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    doSearch(filters)
  }, [
    filters.q, filters.mode, filters.geoScope, filters.categoryId,
    filters.sortBy, filters.page, filters.verified, filters.topRated,
    filters.inStock, filters.fastResponse, filters.sellerType,
    filters.minPrice, filters.maxPrice,
  ])

  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...partial, page: partial.page ?? 1 }))
  }, [])

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS })
    setGeoScope('pan_india')
  }

  const handleCompareToggle = useCallback((item: DiscoveryResult) => {
    if (!compareItems.some(c => c._id === item.id) && compareItems.length >= 4) {
      toast({ title: 'Max 4 items to compare', variant: 'destructive' })
      return
    }
    toggleCompare(toCompareProduct(item))
  }, [compareItems, toggleCompare])

  const results = data?.results ?? []
  const total   = data?.total ?? 0

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #9B5DE518, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3D8BFF18, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="fixed left-0 right-0 z-40 py-4 px-4"
        style={{
          top: '100px',
          background: 'rgba(31,3,24,0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <SearchBar
              initialFilters={filters}
              onSearch={updateFilters}
              isLoading={loading}
            />
          </div>
        </div>
      </div>

      <div className="min-h-screen" style={{ paddingTop: '180px', background: '#1D0001' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="mb-5">
          <EngineBar />
        </div>

        <div className="mb-5">
          <NearToFarBanner
            activeScope={geoScope}
            counts={data?.geoBreakdown?.reduce((acc, g) => {
              const labels: Record<number,string> = {
                1:'near_me',2:'city',3:'district',
                4:'state',5:'pan_india',6:'global',
              }
              acc[labels[g.ring]] = g.count
              return acc
            }, {} as Record<string,number>)}
            onScopeChange={s => {
              setGeoScope(s)
              updateFilters({ geoScope: s })
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['all','products','services','companies'] as const).map(m => (
              <button
                key={m}
                onClick={() => updateFilters({ mode: m })}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: filters.mode===m ? 'rgba(255,77,0,0.15)' : 'transparent',
                  color: filters.mode===m ? '#FF4D00' : 'rgba(255,255,255,0.5)',
                  border: filters.mode===m ? '1px solid rgba(255,77,0,0.3)' : '1px solid transparent',
                }}>
                {m === 'all' ? 'All Results' : m.charAt(0).toUpperCase()+m.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {total > 0 && !loading && (
              <p className="text-white/35 text-xs">
                {total.toLocaleString()} results
                {filters.q && <span> for <strong className="text-white/60">&quot;{filters.q}&quot;</strong></span>}
                {data?.meta?.corrected && (
                  <span className="text-white/40"> Showing <strong>{data.meta.corrected}</strong></span>
                )}
              </p>
            )}

            <div className="flex gap-1">
              {(['grid','list'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: viewMode===v ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.05)',
                    color: viewMode===v ? '#FF4D00' : 'rgba(255,255,255,0.4)',
                  }}>
                  {v==='grid' ? <Grid size={14}/> : <List size={14}/>}
                </button>
              ))}
            </div>

            <button onClick={() => setFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all lg:hidden"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
              }}>
              <SlidersHorizontal size={13} />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <FilterSidebar
            filters={filters}
            categories={categories}
            onChange={updateFilters}
            onReset={resetFilters}
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
          />

          <div className="flex-1 min-w-0">
            {data?.meta?.corrected && (
              <div className="mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
                style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)' }}>
                <Sparkles size={14} style={{ color: '#FF4D00' }} />
                <span className="text-white/60">
                  Showing results for
                  <strong className="text-white mx-1">&quot;{data.meta.corrected}&quot;</strong>
                </span>
              </div>
            )}

            {!loading && data && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">{'\uD83D\uDD0D'}</div>
                <h3 className="text-white font-bold text-xl mb-2">No results found</h3>
                <p className="text-white/40 text-sm max-w-sm">
                  Try different keywords, remove filters, or expand the geo scope to Pan India.
                </p>
                <button onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff' }}>
                  Clear All Filters
                </button>
              </div>
            )}

            <div className={`
              ${viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'flex flex-col gap-3'}
            `}>
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <ResultSkeleton key={i} />)
                : results.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {item.type === 'product' ? (
                        viewMode === 'grid' ? (
                          <CompactProductCard product={toProductCardData(item)} />
                        ) : (
                          <ProductCard product={toProductCardData(item)} />
                        )
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
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                  Previous
                </button>
                <span className="text-white/40 text-sm">
                  Page {filters.page||1} of {data.pages}
                </span>
                <button
                  onClick={() => updateFilters({ page: (filters.page||1) + 1 })}
                  disabled={(filters.page||1) >= data.pages}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff' }}>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {compareItems.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 py-3 px-4"
            style={{
              background: 'rgba(15,5,20,0.96)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,77,0,0.2)',
            }}>
            <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-white/50 flex-shrink-0">
                Compare ({compareItems.length}/4)
              </span>
              {compareItems.map(item => (
                <div key={item._id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-white text-xs">{item.title}</span>
                  <button onClick={() => toggleCompare(item)}
                    className="text-white/30 hover:text-white ml-1">X</button>
                </div>
              ))}
              <div className="ml-auto flex gap-2 flex-shrink-0">
                <button onClick={() => clearCompare()}
                  className="text-xs text-white/35 hover:text-white/60">Clear</button>
                <button
                  onClick={() => router.push(`/compare?ids=${compareItems.map(i=>i._id).join(',')}`)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff' }}>
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
