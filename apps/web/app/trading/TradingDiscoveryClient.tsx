'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Sparkles, ShieldCheck, BadgeCheck, MapPin, Loader2, Building2, Boxes,
  Package, Gem, Briefcase, Star,
} from 'lucide-react'
import { SectionHeader } from '@/components/shared/section-header'
import SearchBar from '@/components/discovery/SearchBar'
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card'
import { fromDiscoveryResult } from '@/components/product/card-converters'
import { useAuthStore } from '@/store/auth-store'
import { getDiscoveryFeed, discoverItemToDiscoveryResult } from '@/lib/api/discovery'
import { getCompanyDirectory } from '@/lib/api/companies'
import { subscribe as subscribeNewsletter } from '@/lib/api/notifications'
import { aiBuyerRecommendations } from '@/lib/api/ai-search'
import { SearchFilters } from '@/types/discovery'
import { toast } from '@/components/ui/use-toast'
import { SectionShell, SkeletonCards } from '@/components/directory/primitives'
import { ServicesPlaceholder, BrandsPlaceholder } from '@/components/directory/services-brands'
import { SectionError } from '@/components/directory/primitives'

// ── Code splitting: heavy sections load on demand ─────────────────────
const IndustriesSection = dynamic(() =>
  import('@/components/directory/industries-section').then(m => m.IndustriesSection),
  { loading: () => <SectionShell><SkeletonCards count={6} variant="tall" /></SectionShell> },
)
const CategoriesSection = dynamic(() =>
  import('@/components/directory/categories-section').then(m => m.CategoriesSection),
  { loading: () => <SectionShell><SkeletonCards count={8} /></SectionShell> },
)
const SubcategoriesSection = dynamic(() =>
  import('@/components/directory/subcategories-section').then(m => m.SubcategoriesSection),
  { loading: () => <SectionShell><SkeletonCards count={6} variant="tall" /></SectionShell> },
)
const ProductsSection = dynamic(() =>
  import('@/components/directory/products-section').then(m => m.ProductsSection),
  { loading: () => <SectionShell><SkeletonCards count={8} /></SectionShell> },
)
const CompaniesSection = dynamic(() =>
  import('@/components/directory/companies-section').then(m => m.CompaniesSection),
  { loading: () => <SectionShell><SkeletonCards count={4} variant="wide" /></SectionShell> },
)
const CitiesSection = dynamic(() =>
  import('@/components/directory/cities-section').then(m => m.CitiesSection),
  { loading: () => <SectionShell><SkeletonCards count={5} variant="wide" /></SectionShell> },
)
const CollectionsSection = dynamic(() =>
  import('@/components/directory/collections-section').then(m => m.CollectionsSection),
  { loading: () => <SectionShell><SkeletonCards count={8} /></SectionShell> },
)

const DEFAULT_FILTERS: SearchFilters = {
  q: '', mode: 'all', geoScope: 'pan_india',
  sortBy: 'relevance', page: 1, limit: 24,
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value?: number; loading: boolean }) {
  const display = value == null || value === 0 ? '\u2014' : value.toLocaleString()
  return (
    <div title="Live Directory Data" className="rounded-2xl border border-border bg-surface p-4 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-text-primary">
        {loading ? <Loader2 size={18} className="mx-auto animate-spin text-accent" /> : display}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
    </div>
  )
}

export default function TradingDiscoveryClient() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [notifyEmail, setNotifyEmail] = useState('')

  // ── Real directory stats (auto-scale) ──────────────────────────────
  const stats = useQuery({
    queryKey: ['directory-stats'],
    queryFn: () => getCompanyDirectory({ page: '1', limit: '1' }),
    staleTime: 300_000,
  })
  const statsData = stats.data?.stats

  const discover = useQuery({
    queryKey: ['trading-discover'],
    queryFn: () => getDiscoveryFeed(1, 50),
    staleTime: 120_000,
  })

  const notifyMutation = useMutation({
    mutationFn: (email: string) => subscribeNewsletter({ email }),
    onSuccess: () => {
      setNotifyEmail('')
      toast({ title: "You're on the list!", description: "We'll notify you when Services launch." })
    },
    onError: () => toast({ title: 'Could not subscribe', variant: 'destructive' }),
  })

  const aiRecs = useMutation({
    mutationFn: () =>
      aiBuyerRecommendations({
        companyId: (user as any)?.companyId,
        limit: 12,
        recentSearches: [],
      }),
  })

  const feed = useMemo(() => discover.data?.items ?? [], [discover.data])
  const featuredProducts = useMemo(
    () => feed.filter(i => i.type === 'product' && i.reason === 'Trending Product').slice(0, 12),
    [feed],
  )

  const handleHeroSearch = (filters: Partial<SearchFilters>) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.mode && filters.mode !== 'all') params.set('mode', filters.mode)
    router.push(`/products?${params.toString()}`)
  }

  const handleAiRecommend = () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in for personalized picks', description: 'Showing trending products instead.' })
      return
    }
    aiRecs.mutate(undefined)
  }

  const aiRecProducts = useMemo(() => {
    const content: any = aiRecs.data?.data?.content
    if (!Array.isArray(content)) return null
    return content
      .filter((p: any) => p && (p.name || p.title) && (p.slug || p.id))
      .slice(0, 12)
      .map((p: any) => ({
        id: p.id ?? p.slug,
        slug: p.slug ?? p.id,
        name: p.name ?? p.title,
        images: Array.isArray(p.images) ? p.images : p.thumbnail ? [p.thumbnail] : [],
        price: Number(p.price ?? 0),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        unit: p.unit ?? 'unit',
        moq: Number(p.moq ?? 1),
        categoryName: p.categoryName ?? p.category ?? '',
        inStock: true,
        isVerified: true,
        trustScore: 0,
        seller: { id: '', name: '', slug: '', isVerified: false, trustScore: 0 },
      }))
  }, [aiRecs.data])

  return (
    <div className="relative min-h-screen bg-bg-base">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent), radial-gradient(circle at 90% 30%, rgba(61,139,255,0.05), transparent 40%)',
        }}
      />

      <div className="relative z-10">
        {/* ─── 1. HERO — AI Search ───────────────────────────────────── */}
        <section className="relative overflow-hidden pb-10 pt-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-accent">
                <Sparkles size={11} /> TRADINGO Master Business Directory
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                Discover. Compare.{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #FF4D00, #FFB37D)' }}
                >
                  Trade India.
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-text-tertiary">
                One search across products, services, suppliers and cities — powered by AI.
              </p>
            </div>

            <div className="mt-10">
              <SearchBar
                initialFilters={DEFAULT_FILTERS}
                onSearch={handleHeroSearch}
                isLoading={false}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-text-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-accent" /> Verified sellers
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck size={13} className="text-accent" /> Escrow protected
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-accent" /> Pan-India
              </span>
            </div>
          </div>
        </section>

        {/* ─── 2. LIVE DIRECTORY STATS ───────────────────────────────── */}
        <section className="pb-6">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard icon={<Building2 className="h-4 w-4" />} label="Companies" value={statsData?.totalCompanies} loading={stats.isLoading} />
              <StatCard icon={<BadgeCheck className="h-4 w-4" />} label="Verified" value={statsData?.verifiedCompanies} loading={stats.isLoading} />
              <StatCard icon={<Gem className="h-4 w-4" />} label="Elite" value={statsData?.eliteCompanies} loading={stats.isLoading} />
              <StatCard icon={<Boxes className="h-4 w-4" />} label="Products" value={statsData?.totalProducts} loading={stats.isLoading} />
              <StatCard icon={<MapPin className="h-4 w-4" />} label="Cities" value={statsData?.totalCities} loading={stats.isLoading} />
              <StatCard icon={<Star className="h-4 w-4" />} label="Avg Rating" value={statsData?.averageRating ?? undefined} loading={stats.isLoading} />
            </div>
            {stats.isError && (
              <p className="mt-3 text-center text-xs text-text-tertiary">
                Live directory stats unavailable — sections still load independently.
              </p>
            )}
          </div>
        </section>

        {/* ─── 3. INDUSTRIES (scalable) ──────────────────────────────── */}
        <IndustriesSection />

        {/* ─── 4. CATEGORIES (featured / popular / all + search) ─────── */}
        <CategoriesSection />

        {/* ─── 5. SUB-CATEGORIES (grouped, A–Z, searchable) ───────────── */}
        <SubcategoriesSection />

        {/* ─── 6. PRODUCTS (6 tabs, infinite) ────────────────────────── */}
        <ProductsSection />

        {/* ─── 7. FEATURED SERVICES (future-ready placeholder) ───────── */}
        <SectionShell>
          <SectionHeader
            title="Services"
            subtitle="Verified business services, coming to TRADINGO."
            align="left"
            className="mb-8"
          />
          <ServicesPlaceholder
            notifyEmail={notifyEmail}
            setNotifyEmail={setNotifyEmail}
            onNotify={() => {
              if (!notifyEmail.trim()) {
                toast({ title: 'Enter your email below', description: 'We\u2019ll notify you when Services launch.' })
                return
              }
              notifyMutation.mutate(notifyEmail.trim())
            }}
          />
        </SectionShell>

        {/* ─── 8. COMPANIES (featured / newest / verified / elite) ───── */}
        <CompaniesSection />

        {/* ─── 9. FEATURED BRANDS (future-ready placeholder) ─────────── */}
        <SectionShell>
          <SectionHeader
            title="Brands"
            subtitle="Trusted names in manufacturing and supplies."
            align="left"
            className="mb-8"
          />
          <BrandsPlaceholder />
        </SectionShell>

        {/* ─── 10. CITIES (popular / A–Z / near me) ─────────────────── */}
        <CitiesSection />

        {/* ─── 11. BUSINESS COLLECTIONS (derived live) ───────────────── */}
        <CollectionsSection />

        {/* ─── 12. RECOMMENDED FOR YOU ───────────────────────────────── */}
        <SectionShell>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              title={isAuthenticated ? 'Recommended For You' : 'Popular Right Now'}
              subtitle={
                isAuthenticated
                  ? 'AI-curated picks based on your trading profile.'
                  : 'Sign in for personalized AI recommendations.'
              }
              align="left"
              className="mb-0"
            />
            <button
              onClick={handleAiRecommend}
              className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-all hover:bg-accent/20"
            >
              {aiRecs.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isAuthenticated ? 'Refresh AI Picks' : 'Get AI Picks'}
            </button>
          </div>

          {aiRecs.isPending ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : aiRecProducts ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {aiRecProducts.map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <ProductCard
                    product={fromDiscoveryResult({
                      id: p.id,
                      slug: p.slug,
                      name: p.name,
                      images: p.images,
                      price: p.price,
                      unit: p.unit,
                      moq: p.moq,
                      categoryName: p.categoryName,
                      inStock: true,
                      seller: { id: '', name: '', slug: '', isVerified: false, trustScore: 0 },
                    } as any)}
                    variant="compact"
                  />
                </motion.div>
              ))}
            </div>
          ) : discover.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : discover.isError ? (
            <SectionError label="recommendations" onRetry={() => discover.refetch()} />
          ) : featuredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.slice(0, 8).map((item, i) => {
                const dr = discoverItemToDiscoveryResult(item)
                if (!dr) return null
                return (
                  <motion.div
                    key={dr.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <ProductCard product={fromDiscoveryResult(dr)} variant="compact" />
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-text-tertiary" />
              <p className="mt-3 text-text-tertiary">Recommendations will appear here.</p>
            </div>
          )}
        </SectionShell>
      </div>
    </div>
  )
}
