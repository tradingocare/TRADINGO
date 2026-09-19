'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Building2, ChevronRight, Clock3, Globe, Headphones, Mail, MapPin, PackageCheck, Phone, RotateCcw, Search, ShieldCheck, Star, Tags, Timer, TrendingUp, Truck } from 'lucide-react'
import { ProductGallery } from '@/components/product-detail-view/gallery'
import { BuyBox } from '@/components/product-detail-view/buy-box'
import { AiTrustGrid, VerifiedBadgeRow, RatingStars } from '@/components/product-detail-view/sections'
import { SpecGrid, DocumentsSection } from '@/components/product-detail-view/spec-grid'
import { useAuthStore } from '@/store/auth-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useCompareStore } from '@/store/compare-store'
import { toast } from '@/components/ui/use-toast'
import type { ProductCardModel } from '@/types/product-card'
import type { ProductDetailViewData } from '@/types/product-detail-view'
import type { ProductDetailMedia, ProductDetailPriceSlab } from '@/types/product-detail'
import { cn } from '@/lib/utils'

interface ProductFullCardProps {
  product: ProductCardModel
  preview?: boolean
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
    // Vendor-provided short positioning line. Shown under the title only
    // when the feed supplies it — never synthesized.
    subtitle: model.description || undefined,
    brand: model.brand,
    category: model.categoryName
      ? { name: model.categoryName, slug: model.subCategory || model.categoryName }
      : undefined,
    subcategory: model.subCategory || undefined,
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/trading' },
      { label: model.title, href: `/trading/${model.slug}` },
    ],
    images: model.images?.length ? model.images : ['/placeholder-product.jpg'],
    // Vendor video only — the gallery shows its Video control solely when set.
    videoUrl: model.videoUrl || undefined,
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
      // Vendor location only. Undefined hides the slot — never "Pan India".
      location: model.seller.city || undefined,
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
      // Buyer proof from the authoritative review aggregate only.
      // monthlyOrders is order velocity, NOT fulfilled buyers — never used.
      happyBuyers: model.reviewCount > 0 ? `${formatCompactCount(model.reviewCount)}+` : undefined,
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

export function ProductFullCard({ product, preview = false }: ProductFullCardProps) {
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

  const media: ProductDetailMedia[] = useMemo(() => {
    const imgs: ProductDetailMedia[] = (product.images?.length ? product.images : ['/placeholder-product.jpg']).map((url, index) => ({
      id: `${product.id}-img-${index}`,
      type: 'IMAGE' as const,
      url,
    }));
    // Vendor video rides along only when the seller actually supplied one.
    if (product.videoUrl) {
      imgs.push({ id: `${product.id}-video-0`, type: 'VIDEO' as const, url: product.videoUrl });
    }
    return imgs;
  }, [product.id, product.images, product.videoUrl])

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

  const previewNotice = () =>
    toast({
      title: 'Sample preview card',
      description: 'This is a demo product. Buy / RFQ / Chat activate when a real seller lists this product.',
    })

  const requireAuth = (action: () => void) => {
    if (preview) {
      previewNotice()
      return
    }
    if (!auth.isAuthenticated) {
      router.push('/login')
      return
    }
    action()
  }

  const handleWishlist = () => requireAuth(() => wishlist.toggle(data.id))

  const handleCompare = () => {
    if (preview) {
      previewNotice()
      return
    }
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
    router.push(`/buyer/rfq/new?source=PRODUCT&sourceId=${data.id}`)
  })

  const handleChat = () => requireAuth(() => {
    const vendorId = data.seller.id || data.seller.slug || ''
    router.push(`/messages?vendor=${encodeURIComponent(vendorId)}&product=${data.id}`)
  })

  const handleShare = async () => {
    if (preview) {
      previewNotice()
      return
    }
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
          <Link href={`/trading/${data.slug}`} className="transition-colors hover:text-accent">
            {data.title}
          </Link>
        </h2>
        {data.subtitle && (
          <p className="w-full truncate text-xs text-text-secondary" title={data.subtitle}>
            {data.subtitle}
          </p>
        )}
        {data.category?.name && (
          <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-text-secondary">
            {data.category.name}
          </span>
        )}
        {data.subcategory && (
          <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-text-secondary">
            {data.subcategory}
          </span>
        )}
        {data.brand && (
          <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-text-tertiary">
            {data.brand}
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
        <div className="ml-auto flex-shrink-0 max-w-full">
          <VerifiedBadgeRow data={data} compact hideRating />
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col space-y-5 lg:col-span-3">
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

        <div className="min-w-0 lg:col-span-2">
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

      <TrustSupportSection data={data} product={product} />
      </div>
    </motion.section>
  )
}

function formatCompactCount(value: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

interface TrustStripItem {
  icon: ComponentType<{ size?: number | string; className?: string }>;
  value: string;
  sub: string;
  boxClass: string;
  iconClass: string;
}

function TrustSupportSection({ data, product }: { data: ProductDetailViewData; product: ProductCardModel }) {
  const gradientBorder = 'linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5)';
  const hasRating = product.rating > 0 && product.reviewCount > 0;

  // Every slot below is real vendor/platform data. Missing data hides the
  // slot (or shows an explicit Ask-Seller state) — nothing is synthesized.
  const items: TrustStripItem[] = [
    {
      icon: Star,
      value: hasRating ? `${product.rating.toFixed(1)}/5` : 'New',
      sub: hasRating ? `Seller Rating (${product.reviewCount})` : 'No reviews yet',
      boxClass: 'border-accent-amber/25 bg-accent-amber/10',
      iconClass: 'text-accent-amber',
    },
  ];

  if (data.leadTime) {
    items.push({
      icon: Truck,
      value: data.leadTime,
      sub: 'Lead Time',
      boxClass: 'border-orange-400/25 bg-orange-400/10',
      iconClass: 'text-orange-400',
    });
  }

  if (product.seller.avgResponseTime) {
    items.push({
      icon: Timer,
      value: product.seller.avgResponseTime,
      sub: 'Avg Response',
      boxClass: 'border-status-success/25 bg-status-success/10',
      iconClass: 'text-status-success',
    });
  }

  // Vendor policies are labelled as vendor policy — never as TRADINGO
  // platform guarantees.
  items.push({
    icon: RotateCcw,
    value: data.returnPolicy || 'Ask Seller',
    sub: 'Returns (Vendor Policy)',
    boxClass: 'border-orange-400/25 bg-orange-400/10',
    iconClass: 'text-orange-400',
  });
  items.push({
    icon: ShieldCheck,
    value: data.warranty || 'Ask Seller',
    sub: 'Warranty (Vendor Policy)',
    boxClass: 'border-sky-400/25 bg-sky-400/10',
    iconClass: 'text-sky-400',
  });

  if (product.keywords?.length) {
    items.push({
      icon: Tags,
      value: product.keywords.slice(0, 2).join(' · '),
      sub: 'Catalogue Tags',
      boxClass: 'border-violet-400/25 bg-violet-400/10',
      iconClass: 'text-violet-400',
    });
  }

  items.push({
    icon: Headphones,
    value: '24/7',
    sub: 'TRADINGO Support',
    boxClass: 'border-status-success/25 bg-status-success/10',
    iconClass: 'text-status-success',
  });

  return (
    <div className="mt-5 rounded-2xl p-[1.5px]" style={{ background: gradientBorder }}>
      <div className="rounded-[14px] bg-surface px-4 py-3">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {items.map((item) => (
            <div key={item.sub} className="flex min-w-[150px] flex-1 items-center gap-2.5">
              <span className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border', item.boxClass, item.iconClass)}>
                <item.icon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-text-primary" title={item.value}>{item.value}</span>
                <span className="block truncate text-[11px] text-text-tertiary" title={item.sub}>{item.sub}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-[11px] text-text-secondary">
          {data.securePayments && (
            <span className="inline-flex items-center gap-1 font-semibold text-status-success">
              <ShieldCheck size={11} /> Escrow-backed secure payments
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Phone size={11} className="text-accent" /> {data.supportPhone || '+91 78277 28852'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail size={11} className="text-accent" /> {data.supportEmail || 'tradingocare@tradingo.in'}
          </span>
          <span className="text-text-tertiary">TRADINGO platform support — not the seller&apos;s private contact</span>
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
              {seller.verified && (
                <span className="inline-flex items-center gap-0.5 shrink-0">
                  <BadgeCheck size={10} className="text-status-success" />
                  <span className="text-[9px] font-semibold text-status-success">Seller Verified</span>
                </span>
              )}
              {seller.elite && <ShieldCheck size={12} className="shrink-0 text-accent" />}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-text-secondary">
              <MapPin size={9} className="text-accent" />
              {seller.location || 'Location on request'}
              {seller.distance ? ` (${seller.distance})` : ''}
            </p>
            {seller.businessType && (
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-text-tertiary">
                <Building2 size={9} className="text-accent" />
                {seller.businessType}
              </p>
            )}
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
