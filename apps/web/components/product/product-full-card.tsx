'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Building2, ChevronRight, Clock3, Globe, MapPin, PackageCheck, Search, ShieldCheck, TrendingUp } from 'lucide-react'
import { ProductGallery } from '@/components/product-detail-view/gallery'
import { BuyBox } from '@/components/product-detail-view/buy-box'
import { AiTrustGrid, VerifiedBadgeRow, RatingStars } from '@/components/product-detail-view/sections'
import { SpecGrid, DocumentsSection } from '@/components/product-detail-view/spec-grid'
import { useAuthStore } from '@/store/auth-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useCompareStore } from '@/store/compare-store'
import type { ProductCardModel } from '@/types/product-card'
import type { ProductDetailViewData } from '@/types/product-detail-view'
import type { ProductDetailMedia, ProductDetailPriceSlab } from '@/types/product-detail'
import { cn } from '@/lib/utils'

interface ProductFullCardProps {
  product: ProductCardModel
}

function toDetailViewData(model: ProductCardModel): ProductDetailViewData {
  const discount =
    model.originalPrice && model.originalPrice > model.price
      ? Math.round(((model.originalPrice - model.price) / model.originalPrice) * 100)
      : 0

  return {
    id: model.id,
    productId: model.id,
    slug: model.slug,
    title: model.title,
    brand: model.brand,
    category: model.categoryName
      ? { name: model.categoryName, slug: model.subCategory || model.categoryName }
      : undefined,
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: model.title, href: `/product/${model.slug}` },
    ],
    images: model.images?.length ? model.images : ['/placeholder-product.jpg'],
    price: model.price,
    mrp: model.originalPrice,
    discount,
    unit: model.unit,
    moq: model.moq || 1,
    leadTime: model.deliveryEta || model.deliveryEstimate,
    stock: {
      inStock: model.inStock ?? true,
      statusLabel: model.inStock ?? true ? 'In Stock' : 'Out of Stock',
      quantity: model.stockQty,
    },
    seller: {
      id: model.seller.id,
      name: model.seller.name,
      slug: model.seller.slug,
      logo: model.seller.logo,
      location: model.seller.city,
      distance: model.geoLabel,
      yearsInBusiness: model.seller.yearsActive,
      verified: model.seller.isVerified,
      elite: model.seller.isTradgoElite,
      gstVerified: model.seller.isGstRegistered,
      isoCertified: model.seller.isoCertified,
      trustScore: model.seller.trustScore || model.trustScoreSnapshot,
    },
    rating: model.rating,
    reviewCount: model.reviewCount,
    gocash: { eligible: !!model.gocashEarn, earn: model.gocashEarn },
    stats: {
      responseRate: model.seller.avgResponseTime ? `< ${model.seller.avgResponseTime}` : undefined,
      happyBuyers: model.monthlyOrders ? `${model.monthlyOrders}+` : undefined,
    },
    specs: model.specifications?.map((spec) => ({
      key: spec.key,
      label: spec.label || spec.key,
      value: spec.value,
    })),
    highlights: model.keywords?.slice(0, 4),
    documents: [],
    listedDate: model.listedDate,
    securePayments: model.tradeCreditEligible,
    returnPolicy: model.returnPolicy,
    warranty: model.warrantyPeriod,
    freeDeliveryAbove: model.freeDeliveryAbove,
    supportPhone: '+91 78277 28852',
    supportEmail: 'support@tradingo.com',
  }
}

export function ProductFullCard({ product }: ProductFullCardProps) {
  const router = useRouter()
  const auth = useAuthStore()
  const wishlist = useWishlistStore()
  const compare = useCompareStore()
  const [quantity, setQuantity] = useState(product.moq || 1)

  useEffect(() => {
    auth.hydrateFromStorage()
    if (auth.isAuthenticated && !wishlist.loaded) wishlist.fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, wishlist.loaded])

  const data = useMemo(() => toDetailViewData(product), [product])

  const media: ProductDetailMedia[] = useMemo(
    () =>
      (product.images?.length ? product.images : ['/placeholder-product.jpg']).map((url, index) => ({
        id: `${product.id}-img-${index}`,
        type: 'IMAGE' as const,
        url,
      })),
    [product.id, product.images],
  )

  const priceSlabs: ProductDetailPriceSlab[] = useMemo(
    () =>
      (product.priceSlabs || []).map((slab, index) => ({
        id: `${product.id}-slab-${index}`,
        minQty: slab.minQty,
        maxQty: slab.maxQty ?? undefined,
        price: slab.price,
        currency: 'INR',
      })),
    [product.id, product.priceSlabs],
  )

  const isWishlisted = wishlist.isSaved(data.id)
  const isCompared = compare.items.some((item) => item._id === data.id)

  const requireAuth = (action: () => void) => {
    if (!auth.isAuthenticated) {
      router.push('/login')
      return
    }
    action()
  }

  const handleWishlist = () => requireAuth(() => wishlist.toggle(data.id))

  const handleCompare = () => {
    compare.toggle({
      _id: data.id,
      slug: data.slug,
      title: data.title,
      images: data.images,
      price: data.price,
      unit: data.unit || 'unit',
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      moq: data.moq,
      inStock: data.stock.inStock,
      seller: {
        businessName: data.seller.name,
        slug: data.seller.slug,
        isVerified: data.seller.verified,
        trustScore: data.seller.trustScore || 0,
        city: data.seller.location || '',
      },
      deliveryEta: data.leadTime,
      stockQty: data.stock.quantity,
      gstInvoiceAvailable: data.seller.gstVerified,
      tradeCreditEligible: false,
      returnPolicy: data.returnPolicy,
    })
  }

  const handleBuy = () => requireAuth(() => {
    router.push(`/checkout?productId=${data.id}&qty=${quantity}`)
  })

  const handleRFQ = () => requireAuth(() => {
    router.push(`/buyer/rfq/create?productId=${data.id}`)
  })

  const handleChat = () => requireAuth(() => {
    const vendorId = data.seller.id || data.seller.slug || ''
    router.push(`/messages?vendor=${encodeURIComponent(vendorId)}&product=${data.id}`)
  })

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, url })
      } catch {
        // User cancelled.
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <motion.section
      className="rounded-2xl p-[1.5px]"
      style={{
        background: 'linear-gradient(120deg, #FF4D00, #FFB800, #00CCCC, #3D8BFF, #9B5DE5, #FF4D00)',
        backgroundSize: '300% 300%',
        boxShadow: '0 0 32px rgba(255,77,0,0.14), 0 0 32px rgba(0,204,204,0.12), 0 0 44px rgba(61,139,255,0.12), 0 0 28px rgba(155,93,229,0.10)',
      }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="rounded-[calc(1rem-1.5px)] bg-surface p-4 sm:p-6">
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-text-tertiary" aria-label="Breadcrumb">
        {data.breadcrumb.map((item, index) => {
          const isLast = index === data.breadcrumb.length - 1
          return (
            <span key={item.href + index} className="inline-flex items-center gap-1.5">
              {index > 0 && <ChevronRight size={11} />}
              {isLast ? (
                <span className="max-w-[220px] truncate font-semibold text-text-primary">{item.label}</span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              )}
            </span>
          )
        })}
        {data.seller.name && (
          <span className="inline-flex items-center gap-1 rounded-md border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            <Building2 size={10} className="flex-shrink-0" />
            <span className="max-w-[160px] truncate">{data.seller.name}</span>
            {data.seller.verified && <BadgeCheck size={10} className="flex-shrink-0 text-status-success" />}
          </span>
        )}
      </nav>

      <div
        className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 55%), radial-gradient(circle at 100% 0%, rgba(255,77,0,0.05), transparent 35%), var(--bg-elevated)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
        <h2 className="min-w-[240px] flex-1 truncate text-sm font-bold text-text-primary" title={data.title}>
          {data.title}
        </h2>
        {data.category?.name && (
          <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-text-secondary">
            {data.category.name}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-text-secondary">
          <RatingStars rating={data.rating || 0} size="sm" />
          <span className="font-bold text-text-primary">
            {data.rating ? data.rating.toFixed(1) : '—'}
          </span>
          {data.reviewCount != null && (
            <span className="text-text-tertiary">({data.reviewCount})</span>
          )}
        </span>
        <div className="ml-auto flex-shrink-0">
          <VerifiedBadgeRow data={data} compact hideRating />
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-5">
        <div className="flex flex-col space-y-5 lg:col-span-3">
          <ProductGallery
            media={media}
            productName={data.title}
            discountPct={data.discount || 0}
            isWishlisted={isWishlisted}
            onWishlist={handleWishlist}
            compact
          />

          <AiTrustGrid data={data} />

          <SpecGrid data={data} />

          <DocumentsSection data={data} />

          <SellerSection seller={data.seller} stats={data.stats} />
        </div>

        <div className="lg:col-span-2">
          <BuyBox
            data={data}
            priceSlabs={priceSlabs}
            price={data.price}
            quantity={quantity}
            onQuantityChange={setQuantity}
            isWishlisted={isWishlisted}
            isCompared={isCompared}
            onBuy={handleBuy}
            onRFQ={handleRFQ}
            onChat={handleChat}
            onSave={handleWishlist}
            onCompare={handleCompare}
            onShare={handleShare}
          />
        </div>
      </div>

      <TrustSupportSection data={data} />
      </div>
    </motion.section>
  )
}

function TrustSupportSection({ data }: { data: ProductDetailViewData }) {
  const gradientBorder = 'linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5)';

  const items = [
    { emoji: '🔄', label: data.returnPolicy || '7 Days Easy Returns', chip: 'border-orange-400/25 bg-orange-400/10 text-orange-400' },
    { emoji: '🛡️', label: data.warranty || '1 Year Warranty', chip: 'border-sky-400/25 bg-sky-400/10 text-sky-400' },
    { emoji: '💳', label: 'UPI / NetBanking', chip: 'border-status-success/25 bg-status-success/10 text-status-success' },
    { emoji: '📞', label: data.supportPhone || '+91 78277 28852', chip: 'border-red-400/25 bg-red-400/10 text-red-400' },
  ];

  const payments = [
    { emoji: '📱', label: 'UPI', chip: 'border-status-success/25 bg-status-success/10 text-status-success' },
    { emoji: '💳', label: 'Cards', chip: 'border-sky-400/25 bg-sky-400/10 text-sky-400' },
    { emoji: '🪙', label: 'TradePay', chip: 'border-orange-400/25 bg-orange-400/10 text-orange-400' },
  ];

  return (
    <div className="mt-5 rounded-2xl p-[1.5px]" style={{ background: gradientBorder }}>
      <div className="rounded-[14px] bg-surface px-3 py-2">
        <div className="flex items-center gap-x-1.5">
          {items.map((item) => (
            <span key={item.label} className={cn('inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded border px-1 py-0.5 text-[8px] font-semibold', item.chip)}>
              <span className="text-[10px] leading-none">{item.emoji}</span>
              {item.label}
            </span>
          ))}
          <span className="h-3 w-px shrink-0 bg-border" />
          <span className="shrink-0 text-[7px] font-semibold uppercase tracking-wider text-text-tertiary">Pay via</span>
          {payments.map((item) => (
            <span key={item.label} className={cn('inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded border px-1 py-0.5 text-[8px] font-semibold', item.chip)}>
              <span className="text-[10px] leading-none">{item.emoji}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SellerSection({ seller, stats }: { seller: ProductDetailViewData['seller']; stats?: ProductDetailViewData['stats'] }) {
  const gradientBorder = 'linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5)';
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(seller.name)}`;

  return (
    <div className="flex flex-1 rounded-2xl p-[1.5px]" style={{ background: gradientBorder }}>
      <div className="flex flex-1 flex-col rounded-[14px] bg-surface px-4 py-5">
        <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Company Profile</p>

        <div className="flex items-center gap-2.5">
          {seller.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={seller.logo} alt={seller.name} className="h-9 w-9 rounded-lg border border-border object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-[10px] font-bold text-text-secondary">
              {seller.name.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-xs font-bold text-text-primary">
              {seller.name}
              {seller.verified && <BadgeCheck size={12} className="shrink-0 text-status-success" />}
              {seller.elite && <ShieldCheck size={12} className="shrink-0 text-accent" />}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-text-secondary">
              <MapPin size={9} className="text-accent" />
              {seller.location || 'Pan India'}
              {seller.distance ? ` (${seller.distance})` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {seller.trustScore != null && (
            <span className="flex flex-col items-center rounded-md border border-border bg-bg-elevated px-1 py-1">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-accent">
                <TrendingUp size={9} /> {seller.trustScore}
              </span>
              <span className="text-[8px] uppercase tracking-wider text-text-tertiary">Trust Score</span>
            </span>
          )}
          {seller.productsListed != null && (
            <span className="flex flex-col items-center rounded-md border border-border bg-bg-elevated px-1 py-1">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-text-primary">
                <PackageCheck size={9} /> {seller.productsListed}
              </span>
              <span className="text-[8px] uppercase tracking-wider text-text-tertiary">Products</span>
            </span>
          )}
          {seller.yearsInBusiness != null && (
            <span className="flex flex-col items-center rounded-md border border-border bg-bg-elevated px-1 py-1">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-text-primary">
                <Clock3 size={9} /> {seller.yearsInBusiness}y
              </span>
              <span className="text-[8px] uppercase tracking-wider text-text-tertiary">In Business</span>
            </span>
          )}
          {seller.responseRate != null && (
            <span className="flex flex-col items-center rounded-md border border-border bg-bg-elevated px-1 py-1">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-status-success">
                <TrendingUp size={9} /> {seller.responseRate}%
              </span>
              <span className="text-[8px] uppercase tracking-wider text-text-tertiary">Response</span>
            </span>
          )}
        </div>

        {(seller.gstVerified || seller.isoCertified) && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {seller.gstVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-status-success/25 bg-status-success/10 px-1.5 py-0.5 text-[9px] font-semibold text-status-success">
                <BadgeCheck size={9} /> GST Verified
              </span>
            )}
            {seller.isoCertified && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-sky-400/25 bg-sky-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-400">
                <ShieldCheck size={9} /> ISO Certified
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-6">
          {seller.website && (
            <a
              href={seller.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-md border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              <Globe size={9} /> Website
            </a>
          )}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-md border border-sky-400/25 bg-sky-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-400 transition-colors hover:bg-sky-400/20"
          >
            <Search size={9} /> Google Business Profile
          </a>
          {seller.slug && seller.slug !== 'undefined' && (
            <Link
              href={`/companies/${seller.slug}`}
              className="ml-auto inline-flex items-center gap-0.5 whitespace-nowrap text-[9px] font-semibold text-text-secondary transition-colors hover:text-accent"
            >
              View Seller Profile <ChevronRight size={9} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductFullCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="h-4 w-1/3 rounded-full bg-bg-elevated animate-pulse" />
      <div className="mt-2 h-7 w-2/3 rounded-lg bg-bg-elevated animate-pulse" />

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <div className="aspect-[2/1] w-full rounded-2xl bg-bg-elevated animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-36 rounded-2xl bg-bg-elevated animate-pulse" />
            <div className="h-36 rounded-2xl bg-bg-elevated animate-pulse" />
            <div className="h-36 rounded-2xl bg-bg-elevated animate-pulse" />
          </div>
          <div className="h-56 w-full rounded-2xl bg-bg-elevated animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-bg-elevated animate-pulse" />
          <div className="h-52 rounded-2xl bg-bg-elevated animate-pulse" />
        </div>
      </div>
    </div>
  )
}
