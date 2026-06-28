'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Package, ShoppingBag, Users, ChevronRight, ExternalLink } from 'lucide-react'
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth'
import { PageHeader } from '@/components/shared/page-header'
import { CATALOG_CATEGORIES, TOTAL_CATALOG_PRODUCTS, TOTAL_CATALOG_SERVICES, TOTAL_CATALOG_SUBCATEGORIES } from '../../data/catalog-data'

export default function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'product' | 'service'>('all')

  const filtered = useMemo(() => {
    return CATALOG_CATEGORIES.filter(cat => {
      if (filter === 'product' && cat.productCount === 0) return false
      if (filter === 'service' && cat.serviceCount === 0) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.subcategories.some(s => s.name.toLowerCase().includes(q))
      )
    })
  }, [search, filter])

  const tabs = [
    { key: 'all', label: 'All Categories', count: CATALOG_CATEGORIES.length },
    { key: 'product', label: 'Products', count: CATALOG_CATEGORIES.filter(c => c.productCount > 0).length },
    { key: 'service', label: 'Services', count: CATALOG_CATEGORIES.filter(c => c.serviceCount > 0).length },
  ] as const

  return (
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
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
          description="Navigate TRADINGO's complete business directory — 160 categories, 1,600 subcategories, 33,600 products & services."
        />

        {/* Stats Bar */}
        <section className="-mt-6 pb-8">
          <div className="container-main">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: 'Categories', value: CATALOG_CATEGORIES.length, icon: Package },
                { label: 'Subcategories', value: TOTAL_CATALOG_SUBCATEGORIES, icon: ChevronRight },
                { label: 'Products', value: TOTAL_CATALOG_PRODUCTS.toLocaleString(), icon: ShoppingBag },
                { label: 'Services', value: TOTAL_CATALOG_SERVICES.toLocaleString(), icon: Users },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-5 py-4 backdrop-blur-xl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(255,77,0,0.15)] to-[rgba(255,77,0,0.05)]">
                    <stat.icon size={18} className="text-[#FF4D00]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/50">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="pb-8">
          <div className="container-main">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search categories or subcategories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-[#FF4D00]/30 focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      filter === t.key
                        ? 'bg-[#FF4D00] text-white shadow-lg shadow-[#FF4D00]/25'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {t.label}
                    <span className="ml-1.5 opacity-60">({t.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results count */}
        <section className="pb-4">
          <div className="container-main">
            <p className="text-sm text-white/40">
              Showing {filtered.length} of {CATALOG_CATEGORIES.length} categories
              {search && (
                <span>
                  {' '}matching &ldquo;<span className="text-white/60">{search}</span>&rdquo;
                </span>
              )}
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="pb-20">
          <div className="container-main">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="mt-16 text-center">
                <p className="text-lg text-white/40">No categories match your search.</p>
              </div>
            )}
          </div>
        </section>

        <ClaimYourGrowth />
      </div>
    </div>
  )
}

function CategoryCard({ cat }: { cat: typeof CATALOG_CATEGORIES[number] }) {
  const [expanded, setExpanded] = useState(false)
  const displaySubs = expanded ? cat.subcategories : cat.subcategories.slice(0, 6)
  const hasMore = cat.subcategories.length > 6

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:border-[rgba(255,77,0,0.2)]"
      style={{
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(600px circle at 50% 50%, rgba(255,77,0,0.06), transparent 40%)',
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(255,77,0,0.15)] to-[rgba(255,77,0,0.05)] text-lg"
            style={{ border: '1px solid rgba(255,77,0,0.1)' }}>
            {cat.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-white truncate">{cat.name}</h3>
            <p className="mt-0.5 text-xs text-white/40 truncate">{cat.description}</p>
          </div>
        </div>

        {/* Counts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {cat.productCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,77,0,0.1)] px-2.5 py-0.5 text-[10px] font-semibold text-[#FF4D00]">
              <Package size={10} /> {cat.productCount.toLocaleString()} Products
            </span>
          )}
          {cat.serviceCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(212,175,55,0.1)] px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
              <Users size={10} /> {cat.serviceCount.toLocaleString()} Services
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-white/50">
            <ShoppingBag size={10} /> {cat.supplierCount}+ Suppliers
          </span>
        </div>

        {/* Subcategories */}
        <div className="mt-4 flex-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Subcategories</p>
          <div className="flex flex-wrap gap-1.5">
            {displaySubs.map((sub) => (
              <Link
                key={sub.slug}
                href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60 transition-all hover:border-[#FF4D00]/20 hover:bg-[rgba(255,77,0,0.06)] hover:text-[#FF4D00]"
              >
                {sub.name}
                {(sub.productCount > 0 || sub.serviceCount > 0) && (
                  <span className="text-[9px] opacity-50">
                    ({sub.productCount > 0 ? `${sub.productCount}p` : ''}{sub.productCount > 0 && sub.serviceCount > 0 ? ',' : ''}{sub.serviceCount > 0 ? `${sub.serviceCount}s` : ''})
                  </span>
                )}
              </Link>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[11px] font-semibold text-[#FF4D00]/70 hover:text-[#FF4D00] transition-colors"
            >
              {expanded ? `Show less` : `+${cat.subcategories.length - 6} more`}
            </button>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/products?category=${cat.slug}`}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(255,77,0,0.12)] bg-gradient-to-r from-[rgba(255,77,0,0.06)] to-[rgba(255,77,0,0.02)] px-4 py-2 text-[11px] font-semibold text-[#FF4D00]/70 transition-all group-hover:from-[rgba(255,77,0,0.1)] group-hover:to-[rgba(255,77,0,0.04)] group-hover:text-[#FF4D00]"
        >
          Browse All {cat.name} <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}
