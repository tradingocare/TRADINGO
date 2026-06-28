'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BadgeCheck, MapPin, Building2, Star,
  Zap, Shield, Package, MessageCircle, FileText,
  Calendar, Users, Award, Truck, TrendingUp,
  CheckCircle2, Clock, Globe,
  ChevronRight, Phone, Share2, Bookmark,
  BarChart3, Target, Headphones, Download,
  Image, Factory, Map, BookOpen, Video,
  Store, Tag, Leaf,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import toast from 'react-hot-toast'
import api from '@/lib/api/client'
import CompanyCard from '@/components/company/CompanyCard'
import ProductCard from '@/components/product/product-card'
import type { ProductCardData } from '@/components/product/product-card'

const PROFILE_TABS = [
  { key:'overview',  label:'Overview' },
  { key:'products',  label:'Products' },
  { key:'profile',   label:'Profile' },
  { key:'gallery',   label:'Gallery' },
  { key:'reviews',   label:'Reviews' },
  { key:'contact',   label:'Contact' },
]

function StatBadge({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center text-center p-3 rounded-2xl gap-1.5"
      style={{ background:`${color}0D`, border:`1px solid ${color}20` }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background:`${color}18` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="font-black text-white text-sm leading-none">{value}</p>
      <p className="text-white/35 text-[9px]">{label}</p>
    </div>
  )
}

export default function CompanyProfileClient({ slug }: { slug: string }) {
  const [company, setCompany]   = useState<any>(null)
  const [products, setProducts] = useState<any>(null)
  const [reviews, setReviews]   = useState<any>(null)
  const [similar, setSimilar]   = useState<any[]>([])
  const [tab, setTab]           = useState('overview')
  const [loading, setLoading]   = useState(true)
  const [saved, setSaved]       = useState(false)
  const { user }  = useAuthStore()
  const router    = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, r, s] = await Promise.allSettled([
          api.get(`/companies/${slug}`),
          api.get(`/companies/${slug}/products?page=1&limit=12`),
          api.get(`/companies/${slug}/reviews?page=1&limit=6`),
          api.get(`/companies/${slug}/similar`),
        ])
        const get = (x: any) => x.status==='fulfilled' ? (x.value as any).data || x.value : null
        const cd = get(c)
        setCompany(cd?.data || cd)
        setProducts(get(p))
        setReviews(get(r))
        const sd = get(s)
        setSimilar(Array.isArray(sd) ? sd : sd?.companies || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [slug])

  const requireAuth = (fn: () => void) => {
    if (!user) { toast.error('Login karein pehle'); router.push('/login'); return }
    fn()
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) { await navigator.share({ title: company?.name, url }) }
    else { await navigator.clipboard.writeText(url); toast.success('Link copied!') }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#1D0001' }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading company profile...</p>
      </div>
    </div>
  )

  if (!company) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background:'#1D0001' }}>
      <Building2 size={48} className="text-white/15" />
      <p className="text-white font-bold text-xl">Trador not found</p>
      <Link href="/companies" className="text-sm font-semibold px-5 py-2 rounded-full"
        style={{ background:'rgba(255,77,0,0.15)', color:'#FF4D00' }}>
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
  const banner = company.bannerUrl || company.banner
  const trustScore = company.trustScore ?? 0

  return (
    <div className="min-h-screen pt-20" style={{ background:'#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-40 w-[700px] h-[700px] rounded-full opacity-12"
          style={{ background:'radial-gradient(circle,#9B5DE518,transparent 70%)', filter:'blur(100px)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#FF4D0018,transparent 70%)', filter:'blur(100px)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-1.5 text-[10px] text-white/30 mb-6">
          <Link href="/" className="hover:text-white/60">Home</Link>
          <ChevronRight size={10} />
           <Link href="/companies" className="hover:text-white/60">Tradors</Link>
          <ChevronRight size={10} />
          <span className="text-white/50">{company.name}</span>
        </div>

        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
          className="rounded-3xl overflow-hidden mb-6"
          style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)', boxShadow:'0 24px 72px rgba(0,0,0,0.5)' }}>
          <div className="relative h-48 sm:h-60 overflow-hidden"
            style={{ background: banner ? `url(${banner}) center/cover` : 'linear-gradient(135deg,#1a0030 0%,#0d0d1a 50%,#1D0001 100%)' }}>
            <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom,transparent 30%,rgba(15,5,20,0.97) 100%)' }} />
            <div className="absolute top-4 left-4 flex gap-2">
              {company.verificationLevel !== 'LEVEL_0' && (
                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background:'rgba(34,197,94,0.2)', border:'1px solid rgba(34,197,94,0.4)', color:'#4ade80' }}>
                  <BadgeCheck size={12} /> KYC Verified
                </span>
              )}
              {company.gstNumber && (
                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background:'rgba(61,139,255,0.15)', border:'1px solid rgba(61,139,255,0.35)', color:'#3D8BFF' }}>
                  <CheckCircle2 size={12} /> GST Verified
                </span>
              )}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)' }}>
                <Share2 size={15} className="text-white/70" />
              </button>
              <button onClick={() => setSaved(s => !s)} className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)' }}>
                <Bookmark size={15} className={saved ? 'fill-[#FF4D00] text-[#FF4D00]' : 'text-white/70'} />
              </button>
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-6 -mt-20 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-5">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-3xl"
                style={{ background:'rgba(255,77,0,0.15)', border:'3px solid rgba(15,5,20,1)', boxShadow:'0 8px 28px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,77,0,0.2)', color:'#FF4D00' }}>
                {company.logo
                  ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                  : company.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-white leading-tight" style={{ fontSize:'clamp(18px,3vw,30px)' }}>
                  {company.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap mt-2">
                  <span className="text-white/45 text-xs flex items-center gap-1">
                    <MapPin size={11} style={{ color:'#FF4D00' }} />
                    {city}{state ? `, ${state}` : ''}
                  </span>
                  {company.businessType && (
                    <span className="text-white/35 text-xs capitalize px-2 py-0.5 rounded-full"
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
                      {company.businessType.replace(/_/g, ' ')}
                    </span>
                  )}
                  {company.establishedYear && (
                    <span className="text-white/35 text-xs flex items-center gap-1">
                      <Calendar size={10} />
                      Since {company.establishedYear}
                    </span>
                  )}
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {categories.slice(0, 6).map((cat: string) => (
                      <span key={cat} className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)' }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={() => requireAuth(() => router.push(`/messages?seller=${company.id}`))}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm"
                  style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff', boxShadow:'0 6px 20px rgba(255,77,0,0.35)' }}>
                  <MessageCircle size={15} /> Chat Now
                </motion.button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={() => requireAuth(() => router.push(`/rfq/create?companyId=${company.id}`))}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.85)' }}>
                  <FileText size={15} /> Send RFQ
                </motion.button>
                {company.phone && (
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    onClick={() => window.open(`tel:${company.phone}`)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm"
                    style={{ background:'rgba(45,224,224,0.1)', border:'1px solid rgba(45,224,224,0.25)', color:'#2DE0E0' }}>
                    <Phone size={14} /> Call
                  </motion.button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <StatBadge icon={Star} value={`${avgRating.toFixed(1)}/5`} label={`${reviewCount} Reviews`} color="#F2C94C" />
              <StatBadge icon={Zap} value={company.responseTime ?? '< 2 hrs'} label="Response Time" color="#FF4D00" />
              <StatBadge icon={Truck} value={`${company.onTimeDelivery ?? 99}%`} label="On-time Delivery" color="#2DE0E0" />
              <StatBadge icon={TrendingUp} value={company.orderCount ? `${company.orderCount >= 1000 ? `${(company.orderCount/1000).toFixed(1)}K+` : `${company.orderCount}+`}` : '500+'} label="Orders Fulfilled" color="#9B5DE5" />
              <StatBadge icon={Shield} value={`${trustScore}/100`} label="Trust Score"
                color={trustScore >= 80 ? '#4ade80' : trustScore >= 60 ? '#F2C94C' : '#f87171'} />
            </div>
          </div>
        </motion.div>

        <div className="sticky top-[72px] z-30 flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background:'rgba(15,5,20,0.9)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)' }}>
          {PROFILE_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all"
              style={{
                background: tab===t.key ? 'rgba(255,77,0,0.15)' : 'transparent',
                color: tab===t.key ? '#FF4D00' : 'rgba(255,255,255,0.45)',
                border: tab===t.key ? '1px solid rgba(255,77,0,0.3)' : '1px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}>
            {tab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                  <div className="rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                      <Building2 size={15} style={{ color:'#FF4D00' }} /> About
                    </h2>
                    <p className="text-white/55 text-sm leading-relaxed">
                      {company.description || 'No description provided.'}
                    </p>
                  </div>

                  {products?.products?.length > 0 && (
                    <div className="rounded-2xl p-5"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-bold text-base flex items-center gap-2">
                          <Package size={15} style={{ color:'#FF4D00' }} /> Main Products
                          <span className="text-white/30 text-xs font-normal">({products.pagination?.total ?? products.products.length})</span>
                        </h2>
                        <button onClick={() => setTab('products')} className="text-xs font-semibold flex items-center gap-1" style={{ color:'#FF4D00' }}>
                          View All <ChevronRight size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {products.products.slice(0, 6).map((p: any) => (
                          <Link key={p.id} href={`/products/${p.slug || p.id}`}
                            className="group rounded-xl overflow-hidden"
                            style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
                            <div className="aspect-square bg-white/5 flex items-center justify-center">
                              {p.images?.[0]
                                ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                : <span className="text-2xl opacity-20">📦</span>
                              }
                            </div>
                            <div className="p-2">
                              <p className="text-white text-[10px] font-semibold line-clamp-1 group-hover:text-[#FF4D00] transition-colors">{p.name}</p>
                              <p className="text-white/40 text-[9px] mt-0.5">₹{p.price?.toLocaleString('en-IN')}/{p.unit}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                      <Award size={15} style={{ color:'#F2C94C' }} /> Certifications
                    </h2>
                    {company.certificationDocs?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {company.certificationDocs.map((cert: any, idx: number) => (
                          <span key={idx} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                            style={{ background:'rgba(242,201,76,0.1)', border:'1px solid rgba(242,201,76,0.25)', color:'#F2C94C' }}>
                            <Award size={10} /> {cert.name || cert}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/40 text-xs">Certification data coming soon.</p>
                    )}
                  </div>

                  {(company.exportMarkets?.length > 0 || company.industries?.length > 0) && (
                    <div className="grid sm:grid-cols-2 gap-5">
                      {company.exportMarkets?.length > 0 && (
                        <div className="rounded-2xl p-5"
                          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                            <Globe size={14} style={{ color:'#2DE0E0' }} /> Export Markets
                          </h2>
                          <div className="flex flex-wrap gap-1.5">
                            {company.exportMarkets.map((m: string, idx: number) => (
                              <span key={idx} className="text-[10px] px-2.5 py-1 rounded-full"
                                style={{ background:'rgba(45,224,224,0.08)', border:'1px solid rgba(45,224,224,0.2)', color:'#2DE0E0' }}>
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {company.industries?.length > 0 && (
                        <div className="rounded-2xl p-5"
                          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                            <Target size={14} style={{ color:'#9B5DE5' }} /> Industries Served
                          </h2>
                          <div className="flex flex-wrap gap-1.5">
                            {company.industries.map((ind: string, idx: number) => (
                              <span key={idx} className="text-[10px] px-2.5 py-1 rounded-full"
                                style={{ background:'rgba(155,93,229,0.08)', border:'1px solid rgba(155,93,229,0.2)', color:'#9B5DE5' }}>
                                {ind}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                      <Shield size={14} style={{ color:'#2DE0E0' }} /> TRADTRUST Score
                    </h2>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-black" style={{ fontSize:'clamp(32px,4vw,44px)', background:'linear-gradient(135deg,#2DE0E0,#3D8BFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                        {trustScore}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-white/25 text-sm">/ 100</span>
                        <span className="text-xs font-semibold"
                          style={{ color: trustScore >= 80 ? '#4ade80' : trustScore >= 60 ? '#F2C94C' : '#f87171' }}>
                          {trustScore >= 80 ? 'High Trust' : trustScore >= 60 ? 'Good Trust' : 'Building Trust'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background:'rgba(255,255,255,0.08)' }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(trustScore, 100)}%` }}
                        transition={{ duration:1, delay:0.3 }} className="h-full rounded-full"
                        style={{ background: trustScore >= 80 ? 'linear-gradient(90deg,#2DE0E0,#4ade80)' : trustScore >= 60 ? 'linear-gradient(90deg,#F2C94C,#f59e0b)' : 'linear-gradient(90deg,#f87171,#ef4444)' }} />
                    </div>
                  </div>

                  <div className="rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-white font-bold text-sm mb-3">Quick Facts</h2>
                    <div className="space-y-2.5">
                      {[
                        { icon: Calendar, label:'Established', value: company.establishedYear },
                        { icon: Users, label:'Employees', value: company.employeeCount },
                        { icon: Globe, label:'Markets', value: company.geographicReach || 'India' },
                        { icon: Package, label:'Products', value: company.totalProducts ? `${company.totalProducts}+ listed` : null },
                        { icon: Clock, label:'Response Rate', value: company.responseRate ? `${company.responseRate}%` : null },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label} className="flex items-center justify-between text-xs py-1.5 border-b"
                          style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                          <span className="text-white/40 flex items-center gap-1.5">
                            <f.icon size={11} style={{ color:'#FF4D00' }} /> {f.label}
                          </span>
                          <span className="text-white/70 font-medium">{f.value}</span>
                        </div>
                      ))}
                      {company.businessHours && (
                        <div className="pt-2">
                          <p className="text-white/40 text-xs flex items-center gap-1.5 mb-2">
                            <Clock size={11} style={{ color:'#FF4D00' }} /> Business Hours
                          </p>
                          {Object.entries(company.businessHours).map(([day, hours]) => (
                            <div key={day} className="flex justify-between text-[10px] py-0.5">
                              <span className="text-white/40 capitalize">{day}</span>
                              <span className="text-white/60">{hours as string}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-base">
                    All Products & Services
                    {products?.pagination?.total && <span className="text-white/30 text-sm ml-2">({products.pagination.total})</span>}
                  </h2>
                </div>

                {(company.brands?.length > 0 || (() => { const cats = [...new Set(products?.products?.flatMap((p: any) => p.category?.name || p.category || []).filter(Boolean))]; return cats.length > 0 })()) && (
                  <div className="grid sm:grid-cols-2 gap-5 mb-6">
                    {(() => { const cats = [...new Set(products?.products?.flatMap((p: any) => p.category?.name || p.category || []).filter(Boolean))]; return cats.length > 0 })() && (
                      <div className="rounded-2xl p-5"
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                          <Tag size={14} style={{ color:'#9B5DE5' }} /> Product Categories
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                          {[...new Set(products.products.flatMap((p: any) => p.category?.name || p.category || []).filter(Boolean))].map((cat: any) => (
                            <Link key={cat} href={`/categories/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-[10px] px-2.5 py-1 rounded-full transition-all hover:scale-105"
                              style={{ background:'rgba(155,93,229,0.08)', border:'1px solid rgba(155,93,229,0.2)', color:'#9B5DE5' }}>
                              {cat}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.brands?.length > 0 && (
                      <div className="rounded-2xl p-5"
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                          <Store size={14} style={{ color:'#F2C94C' }} /> Brands
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                          {company.brands.map((brand: any, idx: number) => (
                            <span key={idx} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                              style={{ background:'rgba(242,201,76,0.08)', border:'1px solid rgba(242,201,76,0.2)', color:'#F2C94C' }}>
                              {brand.name || brand}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!products?.products?.length ? (
                  <div className="text-center py-16">
                    <Package size={44} className="mx-auto mb-3 text-white/15" />
                    <p className="text-white/40 text-sm">No products listed yet</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4">
                      {products.products.map((p: any) => (
                        <ProductCard key={p.id} product={p as ProductCardData} />
                      ))}
                    </div>
                    {products?.pagination?.hasNext && (
                      <div className="flex justify-center mt-8">
                        <button onClick={async () => {
                          const nextPage = Math.ceil(products.products.length / 12) + 1
                          const res: any = await api.get(`/companies/${slug}/products?page=${nextPage}&limit=12`)
                          const d = (res.data || res)
                          setProducts((prev: any) => ({ ...d, products: [...prev.products, ...d.products] }))
                        }} className="px-6 py-2.5 rounded-full text-sm font-semibold"
                          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff' }}>
                          Load More Products
                        </button>
                      </div>
                    )}
                  </>
                )}

                {products?.products?.length > 0 && (
                  <div className="mt-10 rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                      <Package size={14} style={{ color:'#FF4D00' }} /> More from this Trador
                    </h2>
                    <div className="flex flex-col gap-3">
                      {products.products.slice(0, 8).map((p: any) => (
                        <ProductCard key={p.id} product={p as ProductCardData} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'profile' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl p-5"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                    <BarChart3 size={15} style={{ color:'#FF4D00' }} /> Business Details
                  </h2>
                  {[
                    { label:'Company Name', value: company.name },
                    { label:'Business Type', value: company.businessType?.replace(/_/g, ' ') || '—' },
                    { label:'GSTIN', value: company.gstNumber ? `****${company.gstNumber.slice(-4)} (Verified)` : 'Not Provided' },
                    { label:'Established', value: company.establishedYear || '—' },
                    { label:'Employees', value: company.employeeCount || '—' },
                    { label:'Markets', value: company.geographicReach || 'India' },
                    { label:'Certifications', value: company.certificationDocs?.length ? `${company.certificationDocs.length} certs` : '—' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-start text-xs py-2 border-b"
                      style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                      <span className="text-white/40 flex-shrink-0">{row.label}</span>
                      <span className="text-white/70 font-medium text-right max-w-[55%]">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-5"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                    <Target size={15} style={{ color:'#2DE0E0' }} /> Capabilities
                  </h2>
                  {[
                    { label:'Annual Revenue', value: company.annualRevenue ? `₹${(company.annualRevenue/10000000).toFixed(1)} Cr` : '—' },
                    { label:'Export Percentage', value: company.exportPercentage ? `${company.exportPercentage}%` : '—' },
                    { label:'Payment Terms', value: company.paymentTerms || '—' },
                    { label:'Delivery Mode', value: company.deliveryMode || 'FOB, CIF, EXW' },
                    { label:'Packaging', value: company.packagingDetails || 'Standard Export Packaging' },
                    { label:'Lead Time', value: company.leadTime || '—' },
                    { label:'Sample Policy', value: company.samplePolicy || '—' },
                    { label:'Quality Certifications', value: company.qualityCerts?.length ? company.qualityCerts.join(', ') : '—' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-start text-xs py-2 border-b"
                      style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                      <span className="text-white/40 flex-shrink-0">{row.label}</span>
                      <span className="text-white/70 font-medium text-right max-w-[55%]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'gallery' && (
              <div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                      <Image size={15} style={{ color:'#FF4D00' }} /> Photos
                    </h2>
                    {(company.images?.length > 0 || company.galleryImages?.length > 0 || company.factoryImages?.length > 0) ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(company.images || company.galleryImages || company.factoryImages || []).slice(0, 12).map((img: string, idx: number) => (
                          <a key={idx} href={img} target="_blank" rel="noopener noreferrer"
                            className="aspect-square rounded-xl overflow-hidden group">
                            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Image size={36} className="mx-auto mb-2 text-white/15" />
                        <p className="text-white/30 text-xs">No photos uploaded yet</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="rounded-2xl p-5"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                        <Video size={15} style={{ color:'#2DE0E0' }} /> Videos
                      </h2>
                      {company.videos?.length > 0 ? (
                        <div className="space-y-2">
                          {company.videos.slice(0, 4).map((v: any, idx: number) => (
                            <a key={idx} href={v.url || v} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl transition-all"
                              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background:'rgba(45,224,224,0.12)' }}>
                                <Video size={16} style={{ color:'#2DE0E0' }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/70 text-xs font-medium truncate">{v.title || `Video ${idx + 1}`}</p>
                                <p className="text-white/30 text-[10px]">Click to watch</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/30 text-xs">No videos uploaded yet</p>
                      )}
                    </div>
                    <div className="rounded-2xl p-5"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                        <Download size={15} style={{ color:'#9B5DE5' }} /> Catalogues & PDFs
                      </h2>
                      {company.catalogues?.length > 0 || company.cataloguesUrl ? (
                        <div className="space-y-2">
                          {(company.catalogues || []).slice(0, 4).map((cat: any, idx: number) => (
                            <a key={idx} href={cat.url || cat} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl transition-all"
                              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background:'rgba(155,93,229,0.12)' }}>
                                <Download size={16} style={{ color:'#9B5DE5' }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/70 text-xs font-medium truncate">{cat.title || cat.name || `Catalogue ${idx + 1}`}</p>
                                <p className="text-white/30 text-[10px]">Download PDF</p>
                              </div>
                            </a>
                          ))}
                          {company.cataloguesUrl && (
                            <a href={company.cataloguesUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl transition-all"
                              style={{ background:'rgba(155,93,229,0.08)', border:'1px solid rgba(155,93,229,0.2)' }}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background:'rgba(155,93,229,0.15)' }}>
                                <BookOpen size={16} style={{ color:'#9B5DE5' }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/70 text-xs font-medium">Full Catalogue</p>
                                <p className="text-white/30 text-[10px]">View all product catalogue</p>
                              </div>
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-white/30 text-xs">No catalogues uploaded yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {company.infrastructure && (
                  <div className="mt-6 rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                      <Factory size={15} style={{ color:'#FF4D00' }} /> Infrastructure & Manufacturing
                    </h2>
                    {typeof company.infrastructure === 'string' ? (
                      <p className="text-white/55 text-sm leading-relaxed">{company.infrastructure}</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { label:'Factory Area', value: company.infrastructure.factoryArea },
                          { label:'Production Capacity', value: company.infrastructure.productionCapacity },
                          { label:'Number of Units', value: company.infrastructure.numberOfUnits },
                          { label:'R&D Capabilities', value: company.infrastructure.rdCapabilities },
                          { label:'Warehouse', value: company.infrastructure.warehouseDetails },
                          { label:'Machinery', value: company.infrastructure.machineryDetails },
                        ].filter(f => f.value).map(f => (
                          <div key={f.label} className="text-xs py-2 border-b"
                            style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                            <span className="text-white/40 block">{f.label}</span>
                            <span className="text-white/70 font-medium">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {company.factoryImages?.length > 0 && (
                  <div className="mt-6 rounded-2xl p-5"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                      <Factory size={15} style={{ color:'#2DE0E0' }} /> Factory Gallery
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {company.factoryImages.map((img: string, idx: number) => (
                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer"
                          className="aspect-[4/3] rounded-xl overflow-hidden group">
                          <img src={img} alt={`Factory ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                <div className="rounded-2xl p-5 mb-5 flex items-center gap-8 flex-wrap"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-center flex-shrink-0">
                    <p className="font-black text-white" style={{ fontSize:'clamp(40px,6vw,64px)' }}>{avgRating.toFixed(1)}</p>
                    <div className="flex gap-0.5 justify-center my-1.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
                      ))}
                    </div>
                    <p className="text-white/35 text-xs">{reviewCount} total reviews</p>
                  </div>
                  <div className="flex-1 min-w-48 space-y-1.5">
                    {[5,4,3,2,1].map(star => {
                      const count = reviews?.summary?.stars?.[star] ?? 0
                      const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="text-white/40 w-3 text-right">{star}</span>
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width:`${pct}%` }} />
                          </div>
                          <span className="text-white/30 w-5">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {!reviews?.reviews?.length ? (
                  <div className="text-center py-12 text-white/30">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.reviews.map((r: any) => (
                      <div key={r.id} className="rounded-2xl p-5"
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-start justify-between mb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={12} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
                                ))}
                              </div>
                              {r.isVerifiedPurchase && (
                                <span className="flex items-center gap-0.5 text-[9px] text-green-400">
                                  <CheckCircle2 size={9} /> Verified Purchase
                                </span>
                              )}
                            </div>
                            {r.title && <p className="text-white font-semibold text-sm mt-1">{r.title}</p>}
                          </div>
                          <span className="text-white/25 text-[10px] flex-shrink-0 ml-4">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : ''}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">{r.comment || r.review}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-white/30 text-xs">— {r.buyer?.name || 'Verified Buyer'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 rounded-2xl p-6 text-center"
                  style={{ background:'linear-gradient(135deg,rgba(255,77,0,0.08),rgba(155,93,229,0.08))', border:'1px solid rgba(255,77,0,0.15)' }}>
                  <h3 className="text-white font-bold text-sm mb-2">Had a business experience with {company.name}?</h3>
                  <p className="text-white/40 text-xs mb-4">Share your feedback to help other buyers make informed decisions.</p>
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    onClick={() => requireAuth(() => toast.success('Review feature coming soon!'))}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff', boxShadow:'0 6px 20px rgba(255,77,0,0.3)' }}>
                    <Star size={14} className="inline mr-1.5 -mt-0.5" /> Write a Review
                  </motion.button>
                </div>
              </div>
            )}

            {tab === 'contact' && (
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                    <Phone size={15} style={{ color:'#FF4D00' }} /> Contact & Location
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background:'rgba(255,77,0,0.1)' }}>
                        <MapPin size={13} style={{ color:'#FF4D00' }} />
                      </div>
                      <div>
                        <p className="text-white/35 text-[10px]">Address</p>
                        <p className="text-white/70 text-xs">{city}{state ? `, ${state}` : ''}</p>
                      </div>
                    </div>
                    {company.website && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background:'rgba(255,77,0,0.1)' }}>
                          <Globe size={13} style={{ color:'#FF4D00' }} />
                        </div>
                        <div>
                          <p className="text-white/35 text-[10px]">Website</p>
                          <a href={company.website} target="_blank" rel="noopener noreferrer"
                            className="text-[#FF4D00] text-xs hover:underline">{company.website}</a>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-white/25 text-[10px] mt-4 italic">
                    * Direct contact details shared only after verified inquiry via TRADINGO chat.
                  </p>
                </div>
                <div className="rounded-2xl p-5"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                    <MessageCircle size={15} style={{ color:'#FF4D00' }} /> Send a Message
                  </h2>
                  <textarea rows={4} placeholder="Describe your requirement..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }} />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button onClick={() => requireAuth(() => router.push(`/messages?seller=${company.id}`))}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                      style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
                      <MessageCircle size={14} /> Chat
                    </button>
                    <button onClick={() => requireAuth(() => router.push(`/rfq/create?companyId=${company.id}`))}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                      style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff' }}>
                      <FileText size={14} /> RFQ
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2 rounded-2xl overflow-hidden"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <h2 className="text-white font-bold text-base p-5 pb-3 flex items-center gap-2">
                    <Map size={15} style={{ color:'#FF4D00' }} /> Location
                  </h2>
                  {company.latitude && company.longitude ? (
                    <div className="relative w-full h-48 sm:h-64">
                      <iframe
                        title="Company Location"
                        width="100%"
                        height="100%"
                        style={{ border:0, filter:'invert(0.9) hue-rotate(180deg)' }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${company.latitude},${company.longitude}&zoom=14`}
                      />
                    </div>
                  ) : city || state ? (
                    <div className="relative w-full h-48 sm:h-64">
                      <iframe
                        title="Company Location"
                        width="100%"
                        height="100%"
                        style={{ border:0, filter:'invert(0.9) hue-rotate(180deg)' }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${city}, ${state}`)}&zoom=12`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-white/20">
                      <Map size={36} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {similar.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-base">Similar Tradors</h2>
              <Link href={`/companies?category=${categories[0] || ''}`}
                className="text-xs font-semibold flex items-center gap-1" style={{ color:'#FF4D00' }}>
                View More <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similar.map((c: any, i: number) => (
                <CompanyCard key={c.id} company={c} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
