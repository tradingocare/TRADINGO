'use client'

import { Star, Package, Truck, CheckCircle2, TrendingUp, MapPin, Coins, Heart, Globe, RotateCcw, ShieldCheck, BadgeCheck, Cpu, Clock, Receipt, CreditCard } from 'lucide-react'
import type { ProductCardModel } from '@/types/product-card'
import type { ProductCardFeatures } from '@/types/product-card'

interface CardBadgesProps {
  product: ProductCardModel
  features: ProductCardFeatures
}

function formatListedDate(d?: string): string | undefined {
  if (!d) return undefined
  const date = new Date(d)
  if (isNaN(date.getTime())) return undefined
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function CardBadges({ product, features }: CardBadgesProps) {
  const listed = formatListedDate(product.listedDate)
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
      {features.showDelivery && (
        <span className="inline-flex items-center gap-1"><Package size={11} /> MOQ {product.moq}</span>
      )}
      {features.showDelivery && product.deliveryEta && (
        <span className="inline-flex items-center gap-1"><Truck size={11} /> {product.deliveryEta}</span>
      )}
      {features.showDelivery && (
        <span className="inline-flex items-center gap-1" style={{ color: product.inStock ? 'var(--status-success)' : 'var(--status-error)' }}>
          <CheckCircle2 size={11} />
          {product.inStock ? (product.stockQty ? `In stock (${product.stockQty})` : 'In stock') : 'Out of stock'}
        </span>
      )}
      {features.showRating && (
        <span className="inline-flex items-center gap-1">
          <Star size={11} className="fill-accent text-accent" />
          {product.rating.toFixed(1)} ({product.reviewCount})
        </span>
      )}
      {features.showMonthlyOrders && !!product.monthlyOrders && (
        <span className="inline-flex items-center gap-1" style={{ color: 'var(--status-success)' }}>
          <TrendingUp size={11} /> {product.monthlyOrders} orders
        </span>
      )}
      {features.showHappyBuyers && !!product.monthlyOrders && (
        <span className="inline-flex items-center gap-1">
          <Heart size={10} /> {product.monthlyOrders}+ buyers
        </span>
      )}
      {features.showPanIndia && (
        <span className="inline-flex items-center gap-1"><Globe size={10} /> Pan India</span>
      )}
      {features.showFreeDelivery && !!product.freeDeliveryAbove && (
        <span className="inline-flex items-center gap-1" style={{ color: 'var(--status-success)' }}>
          <Truck size={10} /> Free above &#8377;{product.freeDeliveryAbove.toLocaleString('en-IN')}
        </span>
      )}
      {features.showReturnWarranty && !!product.returnPolicy && (
        <span className="inline-flex items-center gap-1"><RotateCcw size={10} /> {product.returnPolicy}</span>
      )}
      {features.showReturnWarranty && !!product.warrantyPeriod && (
        <span className="inline-flex items-center gap-1"><ShieldCheck size={10} /> {product.warrantyPeriod}</span>
      )}
      {features.showCertifications && !!product.certifications?.length && (
        <span className="inline-flex items-center gap-1">
          <BadgeCheck size={10} /> {product.certifications.slice(0, 2).join(', ')}
          {product.certifications.length > 2 ? ` +${product.certifications.length - 2}` : ''}
        </span>
      )}
      {features.showSpecsPreview && !!product.specifications?.length && (
        <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
          <Cpu size={10} className="flex-shrink-0" />
          {product.specifications.slice(0, 3).map(s => `${s.key}: ${s.value}`).join(' · ')}
        </span>
      )}
      {features.showTradeDetails && product.gstInvoiceAvailable && (
        <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded font-medium"
          style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--accent-light)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
          <Receipt size={10} /> GST Invoice
        </span>
      )}
      {features.showTradeDetails && product.tradeCreditEligible && (
        <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded font-medium"
          style={{ background: 'color-mix(in srgb, var(--status-success) 8%, transparent)', color: 'var(--status-success)', border: '1px solid color-mix(in srgb, var(--status-success) 25%, transparent)' }}>
          <CreditCard size={10} /> Trade Credit
        </span>
      )}
      {features.showListedDate && !!listed && (
        <span className="inline-flex items-center gap-1"><Clock size={10} /> Listed {listed}</span>
      )}
      {features.showLocation && product.distanceKm !== undefined && (
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} /> {product.geoLabel || `${product.distanceKm} km`}
        </span>
      )}
      {features.showTrustScore && !!product.trustScoreSnapshot && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium"
          style={{
            background: product.trustScoreSnapshot >= 80 ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)',
            color: product.trustScoreSnapshot >= 80 ? 'var(--accent)' : 'var(--text-tertiary)',
          }}>
          <Star size={10} fill="currentColor" /> {product.trustScoreSnapshot}
        </span>
      )}
      {features.showGocash && !!product.gocashEarn && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium"
          style={{ background: 'color-mix(in srgb, var(--accent-gold) 10%, transparent)', color: 'var(--accent-gold)', border: '1px solid color-mix(in srgb, var(--accent-gold) 25%, transparent)' }}>
          <Coins size={10} /> +{product.gocashEarn} GOCASH
        </span>
      )}
    </div>
  )
}
