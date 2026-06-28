'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Building2, X, Grid, List, MapPin,
  Star, Package, BadgeCheck, Crown,
} from 'lucide-react'
import CompanyCard from '../../components/company/CompanyCard'
import CompanyCardSkeleton from '../../components/company/CompanyCardSkeleton'
import api from '../../lib/api/client'
import toast from 'react-hot-toast'

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
  sellerType: string; minTrust: string
  sortBy: string; page: number
}

const DEFAULT_FILTERS: Filters = {
  q:'', city:'', state:'', verified:false,
  elite:false, sellerType:'', minTrust:'',
  sortBy:'trustScore', page:1,
}

export default function CompanyDirectoryClient() {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inputVal, setInputVal] = useState('')
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid')

  const doFetch = useCallback(async (f: Filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.q)          params.set('q', f.q)
      if (f.city)       params.set('city', f.city)
      if (f.state)      params.set('state', f.state)
      if (f.verified)   params.set('verified', 'true')
      if (f.elite)      params.set('elite', 'true')
      if (f.sellerType) params.set('sellerType', f.sellerType)
      if (f.minTrust)   params.set('minTrust', f.minTrust)
      params.set('sortBy', f.sortBy)
      params.set('page', String(f.page))
      params.set('limit', '24')

      const res: any = await api.get(`/companies/directory?${params}`)
      console.log('[COMPANY-DIR] Params sent:', params.toString())
      console.log('[COMPANY-DIR] Full URL:', api.defaults?.baseURL + '/companies/directory?' + params.toString())
      console.log('[COMPANY-DIR] res.status:', res.status)
      console.log('[COMPANY-DIR] res.data (raw body):', JSON.stringify(res.data).slice(0, 500))
      console.log('[COMPANY-DIR] res.data?.data?.companies?.length:', res.data?.data?.companies?.length)
      console.log('[COMPANY-DIR] res.data?.companies?.length:', (res.data as any)?.companies?.length)

      // Unwrap the TransformInterceptor envelope: { statusCode, data: { companies, pagination } }
      const raw = res.data
      let d = raw?.data                              // try: envelope.data
      if (!d?.companies) d = raw                     // fallback: raw body itself
      if (!d?.companies) d = { companies: Array.isArray(raw) ? raw : [], pagination: null }  // last resort []
      console.log('[COMPANY-DIR] d:', JSON.stringify(d).slice(0, 500))
      console.log('[COMPANY-DIR] d.companies length:', d.companies?.length)
      console.log('[COMPANY-DIR] d.pagination:', d.pagination)
      setData(f.page === 1 ? d : (prev: any) => ({
        ...d,
        companies: [...(prev?.companies || []), ...(d.companies || [])],
      }))
    } catch {
        toast.error('Failed to load tradors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('[COMPANY-DIR] Effect fired with filters:', JSON.stringify(filters))
    doFetch(filters)
  }, [JSON.stringify(filters)])

  const update = (partial: Partial<Filters>) =>
    setFilters(prev => ({ ...prev, ...partial, page: partial.page ?? 1 }))

  const reset = () => { setFilters(DEFAULT_FILTERS); setInputVal('') }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); update({ q: inputVal.trim() }) }

  const companies  = data?.companies || []
  const pagination = data?.pagination
  console.log('[COMPANY-DIR] RENDER: data =', data, 'companies.length =', companies.length, 'loading =', loading, 'pagination =', pagination)
  console.log('[COMPANY-DIR] RENDER: null check - data is null?', data === null, 'companies empty?', companies.length === 0)

  const filteredCompanies = useMemo(() => {
    let result = [...companies]
    const q = filters.q?.toLowerCase().trim()
    const cityFilter = filters.city?.toLowerCase().trim()
    const minTrust = filters.minTrust ? parseInt(filters.minTrust) : 0

    if (q) {
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tagline?.toLowerCase().includes(q)
      )
    }

    if (filters.sellerType) {
      result = result.filter(c => c.sellerType === filters.sellerType)
    }

    if (filters.verified) {
      result = result.filter(c => c.isVerified)
    }

    if (filters.elite) {
      result = result.filter(c => c.isTradgoElite)
    }

    if (cityFilter) {
      result = result.filter(c => c.city?.toLowerCase().includes(cityFilter))
    }

    if (minTrust) {
      result = result.filter(c => (c.trustScore ?? 0) >= minTrust)
    }

    switch (filters.sortBy) {
      case 'trustScore':
        result.sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))
        break
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        break
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
    }

    return result
  }, [companies, filters])

  console.log('[COMPANY-DIR] filteredCompanies.length AFTER useMemo:', filteredCompanies.length)

  const heroStats = [
    { icon: Building2, value: '10L+',   label: 'Tradors' },
    { icon: BadgeCheck, value: '2L+',   label: 'Verified' },
    { icon: Crown,      value: '5K+',   label: 'Elite' },
    { icon: MapPin,     value: '500+',  label: 'Cities' },
    { icon: Package,    value: '33K+',  label: 'Products' },
    { icon: Star,       value: '4.6',   label: 'Avg Rating' },
  ]

  return (
    <div className="min-h-screen pt-20" style={{ background:'#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full opacity-15"
          style={{ background:'radial-gradient(circle,#9B5DE518,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#3D8BFF18,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10">
        <div className="py-12 px-4 text-center"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-6">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
                style={{ background:'rgba(255,77,0,0.1)', border:'1px solid rgba(255,77,0,0.2)', color:'#FF7A3D' }}>
                <Building2 size={11} /> Tradors Directory
              </span>
              <h1 className="font-black text-white mb-3" style={{ fontSize:'clamp(28px,5vw,52px)' }}>
                Find Verified{' '}
                <span style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Tradors
                </span>
              </h1>
              <p className="text-white/45 text-sm sm:text-base max-w-xl mx-auto">
                Browse verified tradors — manufacturers, wholesalers, distributors and service providers from across India.
              </p>
            </motion.div>

            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto mb-8">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)' }}>
                <Search size={16} style={{ color:'#FF4D00' }} className="flex-shrink-0" />
                <input value={inputVal} onChange={e => setInputVal(e.target.value)}
                    placeholder="Search tradors, categories, cities..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none" />
                {inputVal && (
                  <button type="button" onClick={() => { setInputVal(''); update({ q:'' }) }}>
                    <X size={14} className="text-white/30 hover:text-white" />
                  </button>
                )}
              </div>
              <button type="submit" className="px-6 py-3 rounded-2xl font-bold text-sm"
                style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
                Search
              </button>
            </form>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-3xl mx-auto">
              {heroStats.map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-black text-lg text-white" style={{ textShadow:'0 0 20px rgba(255,77,0,0.4)' }}>
                    {s.value}
                  </p>
                  <p className="text-white/30 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6 overflow-x-auto flex-wrap">
            <select value={filters.sortBy} onChange={e => update({ sortBy: e.target.value })}
              className="text-xs px-3 py-2 rounded-xl text-white focus:outline-none flex-shrink-0"
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)' }}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background:'#1D0001' }}>{o.label}</option>
              ))}
            </select>

            <select value={filters.sellerType} onChange={e => update({ sellerType: e.target.value })}
              className="text-xs px-3 py-2 rounded-xl text-white focus:outline-none flex-shrink-0"
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)' }}>
              {SELLER_TYPES.map(o => (
                <option key={o.value} value={o.value} style={{ background:'#1D0001' }}>{o.label}</option>
              ))}
            </select>

            <select value={filters.minTrust} onChange={e => update({ minTrust: e.target.value })}
              className="text-xs px-3 py-2 rounded-xl text-white focus:outline-none flex-shrink-0"
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)' }}>
              {TRUST_RANGES.map(o => (
                <option key={o.value} value={o.value} style={{ background:'#1D0001' }}>{o.label}</option>
              ))}
            </select>

            {[
              { key:'verified' as const, label:'✓ Verified Only' },
              { key:'elite' as const, label:'👑 Elite Only' },
            ].map(chip => (
              <button key={chip.key} onClick={() => update({ [chip.key]: !filters[chip.key] })}
                className="text-xs px-3 py-2 rounded-xl font-semibold flex-shrink-0 transition-all flex items-center gap-1.5"
                style={{
                  background: filters[chip.key] ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.06)',
                  border: filters[chip.key] ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.1)',
                  color: filters[chip.key] ? '#FF4D00' : 'rgba(255,255,255,0.5)',
                }}>
                {chip.label}
              </button>
            ))}

            <input value={filters.city} onChange={e => update({ city: e.target.value })}
              placeholder="📍 City"
              className="text-xs px-3 py-2 rounded-xl text-white placeholder-white/30 focus:outline-none flex-shrink-0 w-28"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }} />

            <button onClick={reset} className="text-xs text-white/35 hover:text-white/60 ml-auto flex-shrink-0">
              Reset Filters
            </button>

            <div className="flex gap-1">
              {(['grid','list'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: viewMode===v ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.05)', color: viewMode===v ? '#FF4D00' : 'rgba(255,255,255,0.4)' }}>
                  {v==='grid' ? <Grid size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>
          </div>

          {!loading && pagination && (
              <p className="text-white/30 text-xs mb-4">
                {(pagination.total ?? filteredCompanies.length).toLocaleString()} tradors found
              {filters.q && <> for <strong className="text-white/50">&quot;{filters.q}&quot;</strong></>}
            </p>
          )}

          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-3'}>
            {loading && filteredCompanies.length === 0
              ? Array.from({ length: 12 }).map((_, i) => <CompanyCardSkeleton key={i} />)
              : filteredCompanies.map((company: any, i: number) => (
                  <motion.div key={company.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.3, delay: (i%12) * 0.04 }}>
                    <CompanyCard company={company} index={i} />
                  </motion.div>
                ))
            }
          </div>

          {!loading && filteredCompanies.length === 0 && (
            <div className="text-center py-20">
              <Building2 size={48} className="mx-auto mb-4 text-white/15" />
              <p className="text-white font-bold text-lg mb-2">No tradors found</p>
              <p className="text-white/40 text-sm mb-4">Try different keywords or remove filters</p>
              <button onClick={reset} className="px-5 py-2 rounded-full text-sm font-semibold"
                style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
                Clear Filters
              </button>
            </div>
          )}

          {pagination?.hasNext && (
            <div className="flex justify-center mt-10">
              <button onClick={() => update({ page: filters.page + 1 })} disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-40"
                style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff' }}>
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-t-[#FF4D00] border-white/20 animate-spin" />
                ) : (
                  <>Load More Tradors ({pagination.total - filteredCompanies.length} remaining)</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
