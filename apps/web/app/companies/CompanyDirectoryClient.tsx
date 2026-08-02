'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Building2, X, MapPin, ChevronRight,
  Star, Package, BadgeCheck, Crown,
} from 'lucide-react'
import Link from 'next/link'
import { Select } from '@/components/ui/select'
import { CompanyFullProfileCard, CompanyFullProfileCardSkeleton } from '@/components/company/company-full-profile-card'
import { toast } from '@/components/ui/use-toast'
import { getCategories } from '@/lib/api/categories'
import { getCompanyDirectory } from '@/lib/api/companies'
import type { DirectoryCompany, DirectoryResponse } from '@/lib/api/companies'

const SELLER_TYPES = [
  { value: '',                label: 'All Types' },
  { value: 'manufacturer',    label: 'Manufacturer' },
  { value: 'wholesaler',      label: 'Wholesaler' },
  { value: 'distributor',     label: 'Distributor' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'retailer',        label: 'Retailer' },
]

const SORT_OPTIONS = [
  { value: 'trustScore', label: 'Most Trusted' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'newest',     label: 'Newly Joined' },
  { value: 'name',       label: 'Name A–Z' },
]

const TRUST_RANGES = [
  { value: '',   label: 'Any Score' },
  { value: '80', label: '80+ (High)' },
  { value: '60', label: '60+ (Good)' },
  { value: '40', label: '40+ (Fair)' },
]

interface Filters {
  q: string; city: string; state: string
  verified: boolean; elite: boolean
  sellerType: string; minTrust: string; category: string
  sortBy: string; page: number
}

const DEFAULT_FILTERS: Filters = {
  q:'', city:'', state:'', verified:false,
  elite:false, sellerType:'', minTrust:'', category:'',
  sortBy:'trustScore', page:1,
}

export default function CompanyDirectoryClient() {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inputVal, setInputVal] = useState('')
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])

  useEffect(() => {
    getCategories({ limit: 160 }).then((wrapper: any) => {
      const raw = wrapper?.data ?? wrapper
      const list = raw?.data ?? raw
      setCategories(Array.isArray(list) ? list.map((n: any) => ({ slug: n.slug, name: n.name })) : [])
    }).catch(() => {})
  }, [])

  const doFetch = useCallback(async (f: Filters) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (f.q)          params.q = f.q
      if (f.city)       params.city = f.city
      if (f.state)      params.state = f.state
      if (f.verified)   params.verified = 'true'
      if (f.elite)      params.elite = 'true'
      if (f.sellerType) params.sellerType = f.sellerType
      if (f.minTrust)   params.minTrust = f.minTrust
      if (f.category)   params.category = f.category
      params.sortBy = f.sortBy
      params.page = String(f.page)
      params.limit = '24'

      const d = await getCompanyDirectory(params)
      setData(f.page === 1 ? d : (prev: any) => ({
        ...d,
        companies: [...(prev?.companies || []), ...(d?.companies || [])],
      }))
    } catch {
        toast.error('Failed to load tradors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    doFetch(filters)
  }, [JSON.stringify(filters)])

  const update = (partial: Partial<Filters>) =>
    setFilters(prev => ({ ...prev, ...partial, page: partial.page ?? 1 }))

  const reset = () => { setFilters(DEFAULT_FILTERS); setInputVal('') }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); update({ q: inputVal.trim() }) }

  const companies: DirectoryCompany[] = data?.companies || []
  const pagination = data?.pagination
  const stats = data?.stats

  const fmt = (n: number) => n >= 10000000 ? `${(n/10000000).toFixed(1)}Cr` : n >= 100000 ? `${(n/100000).toFixed(0)}L` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n)

  const heroStats = [
    { icon: Building2,  label: 'Tradors',     value: stats ? fmt(stats.totalCompanies) : '—' },
    { icon: BadgeCheck, label: 'Verified',    value: stats ? fmt(stats.verifiedCompanies) : '—' },
    { icon: Crown,      label: 'Elite',       value: stats ? fmt(stats.eliteCompanies) : '—' },
    { icon: MapPin,     label: 'Cities',      value: stats ? fmt(stats.totalCities) : '—' },
    { icon: Package,    label: 'Products',    value: stats ? fmt(stats.totalProducts) : '—' },
    { icon: Star,       label: 'Avg Rating',  value: stats ? (stats.averageRating ?? '—').toString() : '—' },
  ]

  return (
    <div className="min-h-screen pt-20 bg-bg-base">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full opacity-15"
          style={{ background:'radial-gradient(circle,#9B5DE518,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#3D8BFF18,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10">
        <div className="py-12 px-4 text-center border-b border-border">
          <div className="max-w-4xl mx-auto">
            <nav className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-xs backdrop-blur-md mb-6" aria-label="Breadcrumb">
              <Link href="/" className="text-text-secondary transition-colors hover:text-accent">
                Home
              </Link>
              <ChevronRight size={12} className="text-text-tertiary" />
              <span className="font-semibold text-text-primary">Tradors</span>
            </nav>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-6">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 bg-accent/10 border-accent/20 text-accent">
                <Building2 size={11} /> Tradors Directory
              </span>
              <h1 className="font-black text-text-primary mb-3" style={{ fontSize:'clamp(28px,5vw,52px)' }}>
                Find Verified{' '}
                <span style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Tradors
                </span>
              </h1>
              <p className="text-text-tertiary text-sm sm:text-base max-w-xl mx-auto">
                Browse verified tradors — manufacturers, wholesalers, distributors and service providers from across India.
              </p>
            </motion.div>

            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto mb-8">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface border-border" style={{ backdropFilter:'blur(20px)' }}>
                <Search size={16} className="flex-shrink-0 text-accent" />
                <input value={inputVal} onChange={e => setInputVal(e.target.value)}
                    placeholder="Search tradors, categories, cities..."
                  className="flex-1 bg-transparent text-text-primary text-sm placeholder-text-tertiary focus:outline-none" />
                {inputVal && (
                  <button type="button" onClick={() => { setInputVal(''); update({ q:'' }) }} aria-label="Clear search">
                    <X size={14} className="text-text-tertiary hover:text-text-primary" />
                  </button>
                )}
              </div>
              <button type="submit" className="px-6 py-3 rounded-2xl font-bold text-sm bg-accent text-btn-primary-text">
                Search
              </button>
            </form>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-3xl mx-auto">
              {heroStats.map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-black text-lg text-text-primary" style={{ textShadow:'0 0 20px rgba(245, 158, 11, 0.4)' }}>
                    {s.value}
                  </p>
                  <p className="text-text-tertiary text-[10px] font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6 overflow-x-auto flex-wrap">
            <Select value={filters.sortBy} onChange={e => update({ sortBy: e.target.value })} size="sm">
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            <Select value={filters.sellerType} onChange={e => update({ sellerType: e.target.value })} size="sm">
              {SELLER_TYPES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            <Select value={filters.minTrust} onChange={e => update({ minTrust: e.target.value })} size="sm">
              {TRUST_RANGES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            <Select value={filters.category} onChange={e => update({ category: e.target.value })} size="sm">
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </Select>

            {[
              { key:'verified' as const, label:'✓ Verified Only' },
              { key:'elite' as const, label:'👑 Elite Only' },
            ].map(chip => (
              <button key={chip.key} onClick={() => update({ [chip.key]: !filters[chip.key] })}
                className={`text-xs px-3 py-2 rounded-xl font-semibold flex-shrink-0 transition-all flex items-center gap-1.5 ${
                  filters[chip.key]
                    ? 'bg-accent/15 border-accent/35 text-accent'
                    : 'bg-surface border-border text-text-tertiary'
                }`}>
                {chip.label}
              </button>
            ))}

            <input value={filters.city} onChange={e => update({ city: e.target.value })}
              placeholder="📍 City"
              className="text-xs px-3 py-2 rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none flex-shrink-0 w-28 bg-surface border-border" />

            <button onClick={reset} className="text-xs text-text-tertiary hover:text-text-secondary ml-auto flex-shrink-0">
              Reset Filters
            </button>
          </div>

          {!loading && pagination && (
              <p className="text-text-tertiary text-xs mb-4">
                {(pagination.total ?? companies.length).toLocaleString()} tradors found
              {filters.q && <> for <strong className="text-text-primary">&quot;{filters.q}&quot;</strong></>}
            </p>
          )}

          <div className="flex flex-col gap-5">
            {loading && companies.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <CompanyFullProfileCardSkeleton key={i} />)
              : companies.map((company: DirectoryCompany, i: number) => (
                  <motion.div key={company.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.3, delay: (i%12) * 0.04 }}>
                    <CompanyFullProfileCard company={company} />
                  </motion.div>
                ))
            }
          </div>

          {!loading && companies.length === 0 && (
            <div className="text-center py-20">
              <Building2 size={48} className="mx-auto mb-4 text-text-tertiary" />
              <p className="text-text-primary font-bold text-lg mb-2">No tradors found</p>
              <p className="text-text-tertiary text-sm mb-4">Try different keywords or remove filters</p>
              <button onClick={reset} className="px-5 py-2 rounded-full text-sm font-semibold bg-accent text-btn-primary-text">
                Clear Filters
              </button>
            </div>
          )}

          {pagination?.hasNext && (
            <div className="flex justify-center mt-10">
              <button onClick={() => update({ page: filters.page + 1 })} disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-40 bg-surface text-text-primary border-border">
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-t-accent border-border animate-spin" />
                ) : (
                  <>Load More Tradors ({Math.max(0, pagination.total - filters.page * 24)} remaining)</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
