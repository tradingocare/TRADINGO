'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MapPin, Calendar, Star, Package, Clock, Shield, MessageCircle,
  FileText, ChevronRight, Building2, BadgeCheck, Truck, Eye, ShoppingCart, ArrowRight,
} from 'lucide-react'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { RatingStars } from '@/components/product-detail-view/sections'
import { useAuthStore } from '@/store/auth-store'
import { getCompanyProducts, getCompanySimilar } from '@/lib/api/companies'
import type { DirectoryCompany, CompanyProduct, SimilarCompany } from '@/lib/api/companies'

interface CompanyFullProfileCardProps {
  company: DirectoryCompany
}

const detailCache = new Map<string, { products: CompanyProduct[]; similar: SimilarCompany[]; ts: number }>()

function cachedDetails(slug: string) {
  const hit = detailCache.get(slug)
  if (hit && Date.now() - hit.ts < 60_000) return hit
  return null
}

function fmtCount(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function CompanyFullProfileCard({ company }: CompanyFullProfileCardProps) {
  const router = useRouter()
  const auth = useAuthStore()
  const [products, setProducts] = useState<CompanyProduct[] | null>(null)
  const [similar, setSimilar] = useState<SimilarCompany[] | null>(null)

  useEffect(() => {
    auth.hydrateFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const cached = cachedDetails(company.slug)
    if (cached) {
      setProducts(cached.products)
      setSimilar(cached.similar)
      return
    }
    let cancelled = false
    Promise.all([
      getCompanyProducts(company.slug, { page: 1, limit: 4 }).then(r => r.products).catch(() => [] as CompanyProduct[]),
      getCompanySimilar(company.slug).catch(() => [] as SimilarCompany[]),
    ]).then(([p, s]) => {
      if (cancelled) return
      setProducts(p)
      setSimilar(s)
      detailCache.set(company.slug, { products: p, similar: s, ts: Date.now() })
    })
    return () => { cancelled = true }
  }, [company.slug])

  const requireAuth = (fn: () => void) => {
    if (!auth.isAuthenticated) {
      router.push('/login')
      return
    }
    fn()
  }

  const location = [company.city, company.state].filter(Boolean).join(', ')
  const rating = company.rating ?? 0
  const reviews = company.reviewCount ?? 0
  const orders = company.orderCount ?? 0
  const tradexa = ((company.trustScore ?? 0) / 20).toFixed(1)
  const yearsActive = company.yearsActive
  const productCount = company.productCount ?? company.totalProducts ?? 0
  const flagship = products?.[0]

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* ── Header banner ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden"
        style={{ background: company.banner
          ? `url(${company.banner}) center/cover`
          : 'linear-gradient(135deg,#1a0030 0%,#0d0d1a 50%,#1D0001 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 30%,rgba(15,5,20,0.9) 100%)' }} />
        <div className="absolute top-3 left-3 flex gap-2">
          {company.isVerified && <VerifiedBadge type="verified" size="md" />}
          {company.isTradgoElite && <VerifiedBadge type="elite" size="md" />}
        </div>
      </div>

      {/* ── Header content ── */}
      <div className="px-4 sm:px-6 pb-4 -mt-10 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-2xl bg-bg-elevated"
            style={{ border: '3px solid var(--surface)', color: 'var(--accent)' }}>
            {company.logo
              ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              : company.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/companies/${company.slug}`} className="font-black text-lg text-text-primary hover:text-accent transition-colors truncate">
                {company.name}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-secondary">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-accent" /> {location}, India
                </span>
              )}
              {yearsActive ? (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {yearsActive}+ yrs
                </span>
              ) : company.establishedYear ? (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> Since {company.establishedYear}
                </span>
              ) : null}
              {company.isoCertified && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-accent/10 text-accent border border-accent/20">
                  <BadgeCheck size={10} /> ISO
                </span>
              )}
              {company.gstNumber && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-secondary text-text-tertiary border border-border">
                  GSTIN ****{company.gstNumber.slice(-4)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={() => requireAuth(() => router.push(`/messages?seller=${company.id}`))}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-accent text-btn-primary-text">
              <MessageCircle size={13} /> Contact Seller
            </button>
            <button
              onClick={() => requireAuth(() => router.push(`/rfq/create?companyId=${company.id}`))}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs bg-surface border border-border text-text-secondary">
              <FileText size={13} /> Request Catalog
            </button>
            <button
              onClick={() => requireAuth(() => router.push(`/messages?vendor=${company.id}`))}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs bg-surface border border-border text-text-secondary">
              <MessageCircle size={13} /> Direct Chat
            </button>
          </div>
        </div>

        {/* ── Metrics grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4">
          <div className="rounded-xl p-3 text-center bg-bg-elevated border border-border">
            <p className="flex items-center justify-center gap-1 text-sm font-black text-text-primary">
              <Star size={12} className="fill-accent text-accent" /> {rating.toFixed(1)}<span className="text-text-tertiary font-medium text-xs">/5</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">{reviews} Reviews</p>
          </div>
          <div className="rounded-xl p-3 text-center bg-bg-elevated border border-border">
            <p className="text-sm font-black text-text-primary">{fmtCount(orders)}+</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Happy Buyers</p>
          </div>
          <div className="rounded-xl p-3 text-center bg-bg-elevated border border-border">
            <p className="text-sm font-black text-text-primary">98.5%</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">On-Time Del.</p>
          </div>
          <div className="rounded-xl p-3 text-center bg-bg-elevated border border-border">
            <p className="text-sm font-black text-text-primary">{company.responseRate ? `${Math.round(company.responseRate)}%` : '—'}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Response Rate</p>
          </div>
          <div className="rounded-xl p-3 text-center bg-bg-elevated border border-border">
            <p className="flex items-center justify-center gap-1 text-sm font-black text-text-primary">
              <Shield size={12} className="text-accent" /> {tradexa}<span className="text-text-tertiary font-medium text-xs">/5.0</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">TRADEXA Score</p>
          </div>
        </div>
      </div>

      {/* ── About & Snapshot ── */}
      <div className="grid lg:grid-cols-3 gap-4 px-4 sm:px-6 py-4 border-t border-border">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5 mb-1.5">
            <Building2 size={14} className="text-accent" /> About
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">
            {company.description || 'No description provided yet.'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-elevated p-3.5">
          <h4 className="text-xs font-bold text-text-primary mb-2.5 flex items-center gap-1.5">
            <Package size={13} className="text-accent" /> Snapshot
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Products Listed</span>
              <span className="text-text-primary font-semibold">{productCount}+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Experience</span>
              <span className="text-text-primary font-semibold">{yearsActive ? `${yearsActive}+ yrs` : company.establishedYear ? `Since ${company.establishedYear}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Primary Location</span>
              <span className="text-text-primary font-semibold text-right max-w-[55%]">{location || '—'}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-text-tertiary">Flagship Product</span>
              {flagship ? (
                <Link href={`/products/${flagship.slug || flagship.id}`}
                  className="text-accent font-semibold inline-flex items-center gap-1 hover:underline text-right max-w-[60%] truncate">
                  {flagship.name} <ArrowRight size={10} />
                </Link>
              ) : (
                <span className="text-text-primary font-semibold">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── All Products by Seller ── */}
      <div className="px-4 sm:px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <Package size={14} className="text-accent" /> All Products by Seller
          </h3>
          <Link href={`/companies/${company.slug}`} className="text-[11px] font-semibold text-accent inline-flex items-center gap-0.5 hover:underline">
            View Full Profile <ChevronRight size={11} />
          </Link>
        </div>

        {products === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border bg-bg-elevated">
                <div className="aspect-square bg-bg-elevated animate-pulse" />
                <div className="p-2 space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded-full bg-bg-elevated animate-pulse" />
                  <div className="h-2 w-1/2 rounded-full bg-bg-elevated animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-xs text-text-tertiary py-4 text-center">No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.map(p => (
              <div key={p.id} className="rounded-xl overflow-hidden border border-border bg-bg-elevated group">
                <Link href={`/products/${p.slug || p.id}`} className="block">
                  <div className="aspect-square bg-bg-elevated flex items-center justify-center overflow-hidden">
                    {p.media?.find(m => m.type === 'IMAGE')?.url ? (
                      <img src={p.media.find(m => m.type === 'IMAGE')!.url} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Package size={22} className="text-text-tertiary/40" />
                    )}
                  </div>
                </Link>
                <div className="p-2.5">
                  <Link href={`/products/${p.slug || p.id}`} className="text-[11px] font-semibold text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                    {p.name}
                  </Link>
                  <p className="text-[10px] text-text-tertiary mt-0.5">₹{(p.price ?? 0).toLocaleString('en-IN')}{p.unit ? `/${p.unit}` : ''}</p>
                  <div className="flex gap-1 mt-2">
                    <Link href={`/products/${p.slug || p.id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-surface border border-border text-text-secondary">
                      <Eye size={10} /> View
                    </Link>
                    <button
                      onClick={() => requireAuth(() => router.push(`/messages?vendor=${company.id}&product=${p.id}`))}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-surface border border-border text-text-secondary">
                      <MessageCircle size={10} /> Chat
                    </button>
                    <button
                      onClick={() => requireAuth(() => router.push(`/checkout?productId=${p.id}&qty=${p.moq || 1}`))}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-accent text-btn-primary-text">
                      <ShoppingCart size={10} /> Buy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Related Suppliers ── */}
      {similar !== null && similar.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-border">
          <h3 className="text-sm font-bold text-text-primary mb-3">Related Tradors & Similar Suppliers</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {similar.map(s => (
              <Link key={s.id} href={`/companies/${s.slug}`}
                className="w-44 flex-shrink-0 rounded-xl border border-border bg-bg-elevated p-3 transition-all hover:border-accent/40">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center font-bold text-sm bg-surface flex-shrink-0">
                    {s.logo
                      ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                      : s.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-text-primary truncate">{s.name}</p>
                    <p className="text-[10px] text-text-tertiary truncate">{[s.city, s.state].filter(Boolean).join(', ') || 'India'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <RatingStars rating={s.trustScore / 20} size="sm" />
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent">View Profile</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export function CompanyFullProfileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="h-40 sm:h-48 bg-bg-elevated animate-pulse" />
      <div className="px-4 sm:px-6 pb-4 -mt-10 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-bg-elevated animate-pulse flex-shrink-0" style={{ border: '3px solid var(--surface)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded-lg bg-bg-elevated animate-pulse" />
            <div className="h-3 w-64 rounded-full bg-bg-elevated animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-bg-elevated animate-pulse" />
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 border-t border-border">
        <div className="h-3.5 w-40 rounded-full bg-bg-elevated animate-pulse mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <div className="aspect-square bg-bg-elevated animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
