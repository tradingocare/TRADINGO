'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Package, ShoppingBag, Users, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth'
import { PageHeader } from '@/components/shared/page-header'
import { useCategoryTree } from '@/hooks/use-categories'
import type { CategoryNode } from '@/lib/api/categories'

interface FlatCategory {
  id: string
  slug: string
  name: string
  icon: string
  description: string
  productCount: number
  serviceCount: number
  supplierCount: number
  subcategories: { name: string; slug: string; productCount: number; serviceCount: number }[]
}

function flattenTree(nodes: CategoryNode[]): FlatCategory[] {
  return nodes.map(node => ({
    id: node.id,
    slug: node.slug,
    name: node.name,
    icon: node.icon || '',
    description: node.description || '',
    productCount: node._count.products,
    serviceCount: node._count.serviceMasters || 0,
    supplierCount: 0,
    subcategories: (node.children || []).map(child => ({
      name: child.name,
      slug: child.slug,
      productCount: child._count.products,
      serviceCount: child._count.serviceMasters || 0,
    })),
  }))
}

function computeTotals(flat: FlatCategory[]) {
  let subcategories = 0
  let products = 0
  let services = 0
  for (const cat of flat) {
    subcategories += cat.subcategories.length
    products += cat.productCount
    services += cat.serviceCount
  }
  return { subcategories, products, services }
}

export default function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'product' | 'service'>('all')
  const { data: tree, isLoading, error } = useCategoryTree()

  const flat: FlatCategory[] = useMemo(() => tree ? flattenTree(tree) : [], [tree])
  const totals = useMemo(() => computeTotals(flat), [flat])

  const filtered = useMemo(() => {
    return flat.filter(cat => {
      if (filter === 'product' && cat.productCount === 0) return false
      if (filter === 'service' && cat.serviceCount === 0) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.subcategories.some(s => s.name.toLowerCase().includes(q))
      )
    })
  }, [flat, search, filter])

  const tabs = [
    { key: 'all' as const, label: 'All Categories', count: flat.length },
    { key: 'product' as const, label: 'Products', count: flat.filter(c => c.productCount > 0).length },
    { key: 'service' as const, label: 'Services', count: flat.filter(c => c.serviceCount > 0).length },
  ]

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
          description="Navigate TRADINGO's complete business directory — 160 categories, 1,600 subcategories, 33,600 products & services."
        />

        {/* Stats Bar */}
        <section className="-mt-6 pb-8">
          <div className="container-main">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: 'Categories', value: flat.length, icon: Package },
                { label: 'Subcategories', value: totals.subcategories.toLocaleString(), icon: ChevronRight },
                { label: 'Products', value: totals.products.toLocaleString(), icon: ShoppingBag },
                { label: 'Services', value: totals.services.toLocaleString(), icon: Users },
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

        {/* Search & Filters */}
        <section className="pb-8">
          <div className="container-main">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search categories or subcategories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full surface-card py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-tertiary backdrop-blur-xl focus:border-accent/30 focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5 surface-card p-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      filter === t.key
                        ? 'bg-accent text-btn-primary-text shadow-lg shadow-accent/25'
                        : 'text-text-tertiary hover:text-text-secondary'
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
            <p className="text-sm text-text-tertiary">
              Showing {filtered.length} of {flat.length} categories
              {search && (
                <span>
                  {' '}matching &ldquo;<span className="text-text-secondary">{search}</span>&rdquo;
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
                <p className="text-lg text-text-tertiary">No categories match your search.</p>
              </div>
            )}
          </div>
        </section>

        <ClaimYourGrowth />
      </div>
    </div>
  )
}

function CategoryCard({ cat }: { cat: FlatCategory }) {
  const [expanded, setExpanded] = useState(false)
  const displaySubs = expanded ? cat.subcategories : cat.subcategories.slice(0, 6)
  const hasMore = cat.subcategories.length > 6

  return (
    <div
      className="group relative flex flex-col overflow-hidden surface-card-lg p-6 transition-all duration-500 hover:border-accent/20"
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
            <h3 className="text-base font-black text-text-primary truncate">{cat.name}</h3>
            <p className="mt-0.5 text-xs text-text-tertiary truncate">{cat.description}</p>
          </div>
        </div>

        {/* Counts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {cat.productCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
              <Package size={10} /> {cat.productCount.toLocaleString()} Products
            </span>
          )}
          {cat.serviceCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(212,175,55,0.1)] px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
              <Users size={10} /> {cat.serviceCount.toLocaleString()} Services
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-0.5 text-[10px] font-semibold text-text-tertiary">
            <ShoppingBag size={10} /> {cat.supplierCount}+ Suppliers
          </span>
        </div>

        {/* Subcategories */}
        <div className="mt-4 flex-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Subcategories</p>
          <div className="flex flex-wrap gap-1.5">
            {displaySubs.map((sub) => (
              <Link
                key={sub.slug}
                href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-all hover:border-accent/20 hover:bg-accent/[0.06] hover:text-accent"
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
              className="mt-2 text-[11px] font-semibold text-accent/70 hover:text-accent transition-colors"
            >
              {expanded ? `Show less` : `+${cat.subcategories.length - 6} more`}
            </button>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/products?category=${cat.slug}`}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-accent/12 bg-gradient-to-r from-[rgba(255,77,0,0.06)] to-[rgba(255,77,0,0.02)] px-4 py-2 text-[11px] font-semibold text-accent/70 transition-all group-hover:from-[rgba(255,77,0,0.1)] group-hover:to-[rgba(255,77,0,0.04)] group-hover:text-accent"
        >
          Browse All {cat.name} <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}
