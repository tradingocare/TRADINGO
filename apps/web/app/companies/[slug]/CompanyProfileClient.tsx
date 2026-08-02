'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MapPin, Building2, Star,
  Shield, Package, MessageCircle, FileText,
  Trophy, CheckCircle2, Phone, Share2, Bookmark,
  ChevronRight, Search, Crown, ArrowUpDown, ArrowRight, ShoppingCart,
} from 'lucide-react'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import toast from 'react-hot-toast'
import api from '@/lib/api/client'
import type { Company } from '@/lib/api/types'
import CompanyCard from '@/components/company/CompanyCard'

const PLACEHOLDER = '/placeholder-product.jpg'

function EliteBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-yellow-400 bg-yellow-400/15 border-yellow-400/25">
      <Crown size={12} /> Elite
    </span>
  )
}

function StatTile({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-3 flex flex-col items-center text-center gap-1.5 min-w-0">
      <Icon size={13} className="text-accent" />
      <span className="font-black text-text-primary text-sm leading-none truncate w-full">{value}</span>
      <span className="text-text-primary/35 text-[9px] truncate w-full">{label}</span>
    </div>
  )
}

function Chip({ icon: Icon, text, color, border }: { icon?: any; text: string; color: string; border: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
      style={{ background: color, border: `1px solid ${border}` }}>
      {Icon && <Icon size={10} />}
      <span className="truncate">{text}</span>
    </span>
  )
}

export default function CompanyProfileClient({ slug }: { slug: string }) {
  const [company, setCompany]   = useState<Company | null>(null)
  const [products, setProducts] = useState<any>(null)
  const [reviews, setReviews]   = useState<any>(null)
  const [similar, setSimilar]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saved, setSaved]       = useState(false)
  const [savedId, setSavedId]   = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [productPage, setProductPage] = useState(1)
  const [productTotal, setProductTotal] = useState(0)
  const { user }  = useAuthStore()
  const router    = useRouter()

  useEffect(() => {
    const load = async () => {
      const [c, p, r, s] = await Promise.allSettled([
        api.get(`/companies/${slug}`),
        api.get(`/companies/${slug}/products?page=1&limit=12`),
        api.get(`/companies/${slug}/reviews?page=1&limit=6`),
        api.get(`/companies/${slug}/similar`),
      ])
      const get = (x: any) => x.status==='fulfilled' ? (x.value as any).data || x.value : null
      const cd = get(c)
      setCompany(cd?.data || cd)
      const pd = get(p)
      setProducts(pd)
      setProductTotal(pd?.pagination?.total ?? pd?.products?.length ?? 0)
      const rd = get(r)
      setReviews(rd)
      const sd = get(s)
      setSimilar(Array.isArray(sd) ? sd : sd?.companies || [])
      setLoading(false)
    }
    load()
  }, [slug])

  useEffect(() => {
    if (company?.id && user?.role === 'BUYER') {
      api.get(`/buyer/saved-suppliers/check/${company.id}`).then((r: any) => {
        const data = r.data?.data || r.data
        setSaved(data.saved)
        setSavedId(data.id)
      }).catch(() => {})
    }
  }, [company?.id, user?.role])

  const handleSave = async () => {
    if (!company?.id) return
    if (saved && savedId) {
      try { await api.delete(`/buyer/saved-suppliers/${savedId}`); setSaved(false); setSavedId(null); toast.success('Removed from saved') }
      catch { toast.error('Failed to unsave') }
    } else {
      try { const r: any = await api.post('/buyer/saved-suppliers', { companyId: company.id }); const d = r.data?.data || r.data; setSaved(true); setSavedId(d.id); toast.success('Company saved!') }
      catch { toast.error('Failed to save company') }
    }
  }

  const requireAuth = (fn: () => void) => {
    if (!user) { toast.error('Login karein pehle'); router.push('/login'); return }
    fn()
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) { await navigator.share({ title: company?.name, url }) }
    else { await navigator.clipboard.writeText(url); toast.success('Link copied!') }
  }

  const loadMoreProducts = async () => {
    const next = productPage + 1
    try {
      const r: any = await api.get(`/companies/${slug}/products?page=${next}&limit=12`)
      const d = r.data?.data || r.data
      setProducts((prev: any) => ({ ...prev, products: [...(prev?.products || []), ...(d?.products || [])] }))
      setProductTotal(d?.pagination?.total ?? productTotal)
      setProductPage(next)
    } catch { toast.error('Failed to load more products') }
  }

  const allProducts = products?.products || []
  const filteredProducts = useMemo(() => {
    let result = [...allProducts]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p: any) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      )
    }
    switch (sortBy) {
      case 'price_asc': result.sort((a: any, b: any) => (a.price || 0) - (b.price || 0)); break
      case 'price_desc': result.sort((a: any, b: any) => (b.price || 0) - (a.price || 0)); break
      case 'name_asc': result.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')); break
      case 'newest': result.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); break
    }
    return result
  }, [allProducts, searchQuery, sortBy])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-2 border-t-accent border-border animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary text-sm">Loading seller profile...</p>
      </div>
    </div>
  )

  if (!company) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg-base">
      <Building2 size={48} className="text-text-primary/15" />
      <p className="text-text-primary font-bold text-xl">Trador not found</p>
      <Link href="/companies" className="text-sm font-semibold px-5 py-2 rounded-full bg-accent/15 text-accent">
        Back to Directory
      </Link>
    </div>
  )

  const avgRating = reviews?.summary?.average ?? company.rating ?? 0
  const reviewCount = reviews?.summary?.total ?? company.reviewCount ?? 0
  const categories = company.categories?.map?.((c: any) => c.category?.name || c.name || c) || []
  const location = company.locations?.[0] || {}
  const city = location.city || company.city || ''
  const state = location.state || company.state || ''
  const trustScore = company.trustScore ?? 0
  const isElite = /ELITE/i.test((company as any).subscriptionPlan || '') || (company as any).isTradgoElite
  const isVerified = company.verificationLevel && company.verificationLevel !== 'LEVEL_0'
  const years = company.establishedYear ? Math.max(0, new Date().getFullYear() - Number(company.establishedYear)) : 0
  const isoCertified = (company.certifications || []).some((c: string) => /ISO/i.test(c)) ||
    (company.certificationDocs || []).some((c: any) => /ISO/i.test(c.name || ''))
  const totalProducts = company.totalProducts || (company as any)._count?.products || products?.pagination?.total || allProducts.length || 0
  const flagship = allProducts.find((p: any) => p.isFeatured) || allProducts[0]
  const contactPhone = company.mobile || company.phone || ''
  const catalogueUrl = company.cataloguesUrl || company.catalogues?.[0]?.url

  const handleContact = () => {
    if (contactPhone) window.open(`tel:${contactPhone}`)
    else if (company.email) window.open(`mailto:${company.email}`)
    else toast.error('No contact details available')
  }

  const handleRequestCatalog = () => {
    if (catalogueUrl) { window.open(catalogueUrl, '_blank', 'noopener,noreferrer'); return }
    requireAuth(() => router.push(`/rfq/create?companyId=${company.id}`))
  }

  return (
    <div className="min-h-screen pt-20 bg-bg-base">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-40 w-[700px] h-[700px] rounded-full opacity-12"
          style={{ background:'radial-gradient(circle,#9B5DE518,transparent 70%)', filter:'blur(100px)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#FF4D0018,transparent 70%)', filter:'blur(100px)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-1.5 text-[10px] text-text-primary/30 mb-6">
          <Link href="/" className="hover:text-text-primary/60">Home</Link>
          <ChevronRight size={10} />
          <Link href="/companies" className="hover:text-text-primary/60">Tradors</Link>
          <ChevronRight size={10} />
          <span className="text-text-primary/50">{company.name}</span>
        </div>

        {/* HEADER BANNER — Seller Profile Summary */}
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
          className="glass-card-xl ambient-backlight relative overflow-hidden mb-6">
          <div className="relative h-32 sm:h-36 overflow-hidden"
            style={{ background: company.banner || company.bannerUrl
              ? `url(${company.banner || company.bannerUrl}) center/cover`
              : 'linear-gradient(135deg,#1a0030 0%,#0d0d1a 50%,#1D0001 100%)' }}>
            <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom,transparent 20%,rgba(15,5,20,0.92) 100%)' }} />
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={handleShare} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-sm hover:bg-black/60 transition-all">
                <Share2 size={13} className="text-text-primary/70" />
              </button>
              <button onClick={() => requireAuth(handleSave)} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-sm hover:bg-black/60 transition-all">
                <Bookmark size={13} className={saved ? 'fill-accent text-accent' : 'text-text-primary/70'} />
              </button>
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-6 -mt-14 relative">
            <div className="flex flex-col lg:flex-row items-start gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-3xl"
                style={{ background: 'var(--accent)/15', border: '3px solid var(--bg-elevated)', boxShadow: '0 8px 28px rgba(0,0,0,0.6), 0 0 0 1px var(--accent)/20', color: 'var(--accent)' }}>
                {company.logo
                  ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                  : company.name?.[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-black text-text-primary leading-tight" style={{ fontSize:'clamp(16px,2.4vw,24px)' }}>
                    {company.name}
                  </h1>
                  {isVerified && <VerifiedBadge type="verified" size="sm" />}
                  {isElite && <EliteBadge />}
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-2 text-[11px] text-text-primary/55">
                  {(city || state) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-accent" />
                      {city}{state ? `, ${state}` : ''}, India
                    </span>
                  )}
                  {years > 0 && (
                    <span className="flex items-center gap-1">
                      <Trophy size={11} className="text-accent" />
                      {years}+ Years in Business
                    </span>
                  )}
                  {isoCertified && (
                    <span className="flex items-center gap-1">
                      <Shield size={11} className="text-accent" />
                      ISO 9001 Certified
                    </span>
                  )}
                </div>

                {company.gstNumber && (
                  <p className="text-text-primary/40 text-[11px] mt-1.5">
                    GSTIN: <span className="text-text-primary/70 font-medium">{company.gstNumber}</span>
                  </p>
                )}

                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {categories.slice(0, 6).map((cat: string) => (
                      <Chip key={cat} text={cat} color="var(--surface)" border="var(--border-color)" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 flex-shrink-0 w-full lg:w-auto lg:pt-4">
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={handleContact}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs flex-1 lg:flex-none"
                  style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff', boxShadow:'0 6px 20px rgba(255,77,0,0.35)' }}>
                  <Phone size={13} /> Contact Seller
                </motion.button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={handleRequestCatalog}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs flex-1 lg:flex-none bg-surface border-border text-text-secondary">
                  <FileText size={13} /> Request Catalog
                </motion.button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={() => requireAuth(() => router.push(`/messages?seller=${company.id}`))}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs flex-1 lg:flex-none"
                  style={{ background:'rgba(45,224,224,0.1)', border:'1px solid rgba(45,224,224,0.25)', color:'#2DE0E0' }}>
                  <MessageCircle size={13} /> Direct Chat
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* METRICS & PERFORMANCE STATS GRID */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <StatTile icon={Star} value={`${avgRating ? avgRating.toFixed(1) : '0.0'}★`} label={`${reviewCount} Reviews`} />
          <StatTile icon={Package} value={company.orderCount ? (company.orderCount >= 1000 ? `${(company.orderCount/1000).toFixed(1)}K+` : `${company.orderCount}+`) : '—'} label="Trusted Buyers" />
          <StatTile icon={Shield} value={company.onTimeDelivery ? `${company.onTimeDelivery}%` : '—'} label="On-Time Delivery" />
          <StatTile icon={MessageCircle} value={company.responseRate ? `${company.responseRate}%` : '—'} label="Response Rate" />
          <StatTile icon={Trophy} value={trustScore ? `${(trustScore/20).toFixed(1)}/5.0` : '—'} label="TRADEXA Score" />
        </motion.div>

        {/* ABOUT & SNAPSHOT */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 rounded-2xl p-5 bg-surface border-border">
            <h2 className="text-text-primary font-bold text-base mb-3 flex items-center gap-2">
              <Building2 size={15} className="text-accent" /> About {company.name}
            </h2>
            <p className="text-text-primary/55 text-sm leading-relaxed">
              {company.description || 'No description provided.'}
            </p>
            {company.businessType && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Chip text={company.businessType.replace(/_/g, ' ')} color="var(--surface)" border="var(--border-color)" />
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5 bg-surface border-border">
            <h2 className="text-text-primary font-bold text-base mb-3 flex items-center gap-2">
              <Package size={15} className="text-accent" /> Company Snapshot
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-text-tertiary flex items-center gap-1.5">
                  <Package size={11} className="text-accent" /> Products Listed
                </span>
                <span className="text-text-primary/70 font-medium">{totalProducts}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-text-tertiary flex items-center gap-1.5">
                  <Trophy size={11} className="text-accent" /> Experience
                </span>
                <span className="text-text-primary/70 font-medium">{years > 0 ? `${years}+ Years` : '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-text-tertiary flex items-center gap-1.5">
                  <MapPin size={11} className="text-accent" /> Primary Location
                </span>
                <span className="text-text-primary/70 font-medium text-right max-w-[55%]">{city}{state ? `, ${state}` : ''}{!city && !state ? 'India' : ''}</span>
              </div>
              {flagship && (
                <Link href={`/products/${flagship.slug || flagship.id}`}
                  className="flex items-center justify-between py-1.5 group">
                  <span className="text-text-tertiary flex items-center gap-1.5">
                    <ShoppingCart size={11} className="text-accent" /> Flagship Product
                  </span>
                  <span className="text-accent font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all truncate max-w-[55%]">
                    {flagship.name} <ArrowRight size={11} />
                  </span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ALL PRODUCTS BY SELLER */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
              <Package size={15} className="text-accent" /> All Products by Seller
              <span className="text-text-tertiary text-xs font-normal">({totalProducts})</span>
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full sm:w-52 h-9 pl-8 pr-3 rounded-xl text-xs bg-surface border border-border text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent/50"
                />
              </div>
              <div className="relative">
                <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 pl-7 pr-2 rounded-xl text-[11px] bg-surface border border-border text-text-secondary focus:outline-none focus:border-accent/50">
                  <option value="default">Sort</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A-Z</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>

          {allProducts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-surface border-border">
              <Package size={44} className="mx-auto mb-3 text-text-primary/15" />
              <p className="text-text-tertiary text-sm">No products listed yet</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-surface border-border">
              <Search size={44} className="mx-auto mb-3 text-text-primary/15" />
              <p className="text-text-tertiary text-sm">No products match your search</p>
              <button onClick={() => setSearchQuery('')} className="mt-3 text-xs font-semibold text-accent hover:underline">Clear search</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p: any) => {
                  const media = p.media || []
                  const img = media.find((m: any) => m.type === 'IMAGE')?.url || p.images?.[0] || PLACEHOLDER
                  const price = p.price ?? p.priceSlabs?.[0]?.price
                  return (
                    <div key={p.id} className="rounded-2xl overflow-hidden bg-surface border border-border group flex flex-col">
                      <Link href={`/products/${p.slug || p.id}`} className="block relative aspect-square overflow-hidden">
                        <img src={img} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }} />
                        {p.isFeatured && (
                          <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background:'rgba(242,201,76,0.2)', border:'1px solid rgba(242,201,76,0.4)', color:'#F2C94C' }}>
                            Featured
                          </span>
                        )}
                      </Link>
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-text-primary text-[11px] font-semibold line-clamp-1 group-hover:text-accent transition-colors">{p.name}</p>
                        <p className="text-text-tertiary text-[10px] mt-0.5 truncate">{p.category?.name || p.categoryName || ''}</p>
                        <div className="mt-1.5">
                          {price ? (
                            <p className="text-text-primary font-black text-sm">₹{price.toLocaleString('en-IN')}<span className="text-text-tertiary font-normal text-[10px]">/{p.unit || 'unit'}</span></p>
                          ) : (
                            <p className="text-text-primary/70 font-semibold text-[11px]">Price on Request</p>
                          )}
                        </div>
                        <div className="mt-auto pt-2.5 flex gap-1.5">
                          <Link href={`/products/${p.slug || p.id}`}
                            className="flex-1 h-7 rounded-lg text-[10px] font-semibold flex items-center justify-center bg-surface border border-border text-text-secondary hover:bg-surface-secondary transition-all">
                            View
                          </Link>
                          <button onClick={() => requireAuth(() => router.push(`/messages?seller=${company.id}`))}
                            className="flex-1 h-7 rounded-lg text-[10px] font-semibold flex items-center justify-center"
                            style={{ background:'rgba(45,224,224,0.1)', border:'1px solid rgba(45,224,224,0.25)', color:'#2DE0E0' }}>
                            Chat
                          </button>
                          <Link href={`/products/${p.slug || p.id}`}
                            className="flex-1 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center text-white"
                            style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)' }}>
                            Buy
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {filteredProducts.length < productTotal && (
                <div className="flex justify-center mt-6">
                  <button onClick={loadMoreProducts}
                    className="px-6 py-2.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-secondary hover:bg-surface-secondary transition-all">
                    Load More ({productTotal - filteredProducts.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* RELATED & SIMILAR SUPPLIERS */}
        {similar.length > 0 && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
                <Building2 size={15} className="text-accent" /> Related & Similar Suppliers
              </h2>
              <Link href={`/companies?category=${categories[0] || ''}`}
                className="text-xs font-semibold flex items-center gap-1 text-accent">
                View More <ChevronRight size={12} />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {similar.map((c: any, i: number) => (
                <div key={c.id} className="min-w-[280px] w-[280px] flex-shrink-0">
                  <CompanyCard company={c} index={i} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
