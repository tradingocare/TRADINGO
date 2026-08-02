export type CardVariant = 'default' | 'compact' | 'minimal'

export interface ProductCardSeller {
  id: string
  name: string
  slug?: string
  isVerified: boolean
  trustScore: number
  isTradgoElite?: boolean
  isGstRegistered?: boolean
  isoCertified?: boolean
  yearsActive?: number
  city?: string
  avgResponseTime?: string
  logo?: string
}

export interface ProductCardModel {
  // Identity
  id: string
  slug: string
  title: string
  images: string[]
  videoUrl?: string

  // Classification
  categoryName: string
  subCategory?: string
  brand?: string
  type?: 'product' | 'service'

  // Pricing
  price: number
  originalPrice?: number
  unit: string
  moq: number
  maxOrderQty?: number
  priceSlabs?: { minQty: number; maxQty: number | null; price: number }[]

  // Seller
  seller: ProductCardSeller

  // Rating & Social Proof
  rating: number
  reviewCount: number
  monthlyOrders?: number
  isBestseller?: boolean
  savedCount?: number
  viewCount?: number

  // Logistics
  inStock: boolean
  stockQty?: number
  deliveryEta?: string
  freeDeliveryAbove?: number

  // Geo
  distanceKm?: number
  geoLabel?: string

  // Rewards
  gocashEarn?: number

  // Trust
  trustScoreSnapshot?: number

  // Premium
  isPremium?: boolean
  isTradgo?: boolean

  // Feature flags
  gstInvoiceAvailable?: boolean
  tradeCreditEligible?: boolean
  returnPolicy?: string
  isSampleOrder?: boolean

  // Listing card upgrade (8 groups)
  warrantyPeriod?: string
  certifications?: string[]
  listedDate?: string
  specifications?: { key: string; label?: string; value: string }[]
  deliveryEstimate?: string
  keywords?: string[]}

export interface ProductCardFeatures {
  showImage?: boolean
  showBadges?: boolean
  showSeller?: boolean
  showRating?: boolean
  showPrice?: boolean
  showActions?: boolean
  showLocation?: boolean
  showCompare?: boolean
  showWishlist?: boolean
  showGocash?: boolean
  showTrustScore?: boolean
  showQuantitySelector?: boolean
  showDelivery?: boolean
  showCategory?: boolean
  showBrand?: boolean
  showDiscountPct?: boolean
  showSavings?: boolean
  showMonthlyOrders?: boolean
  showCertifications?: boolean
  showSpecsPreview?: boolean
  showListedDate?: boolean
  showReport?: boolean
  showHappyBuyers?: boolean
  showPanIndia?: boolean
  showFreeDelivery?: boolean
  showReturnWarranty?: boolean
  showSellerChips?: boolean
  showTradeDetails?: boolean
  showKeywords?: boolean
}

export const VARIANT_FEATURES: Record<CardVariant, ProductCardFeatures> = {
  default: {
    showImage: true,
    showBadges: true,
    showSeller: true,
    showRating: true,
    showPrice: true,
    showActions: true,
    showLocation: true,
    showCompare: true,
    showWishlist: true,
    showGocash: true,
    showTrustScore: false,
    showQuantitySelector: true,
    showDelivery: true,
    showCategory: true,
    showBrand: false,
    showDiscountPct: true,
    showSavings: true,
    showMonthlyOrders: true,
    showCertifications: true,
    showSpecsPreview: true,
    showListedDate: true,
    showReport: true,
    showHappyBuyers: true,
    showPanIndia: true,
    showFreeDelivery: true,
    showReturnWarranty: true,
    showSellerChips: true,
    showTradeDetails: true,
    showKeywords: true,
  },
  compact: {
    showImage: true,
    showBadges: true,
    showSeller: true,
    showRating: true,
    showPrice: true,
    showActions: true,
    showLocation: false,
    showCompare: true,
    showWishlist: true,
    showGocash: false,
    showTrustScore: false,
    showQuantitySelector: false,
    showDelivery: false,
    showCategory: false,
    showBrand: false,
    showDiscountPct: true,
    showSavings: false,
    showMonthlyOrders: false,
    showCertifications: false,
    showSpecsPreview: false,
    showListedDate: false,
    showReport: false,
    showHappyBuyers: false,
    showPanIndia: false,
    showFreeDelivery: false,
    showReturnWarranty: false,
    showSellerChips: false,
  },
  minimal: {
    showImage: true,
    showBadges: false,
    showSeller: true,
    showRating: false,
    showPrice: true,
    showActions: false,
    showLocation: false,
    showCompare: false,
    showWishlist: false,
    showGocash: false,
    showTrustScore: false,
    showQuantitySelector: false,
    showDelivery: false,
    showCategory: true,
    showBrand: false,
    showDiscountPct: false,
    showSavings: false,
    showMonthlyOrders: false,
    showCertifications: false,
    showSpecsPreview: false,
    showListedDate: false,
    showReport: false,
    showHappyBuyers: false,
    showPanIndia: false,
    showFreeDelivery: false,
    showReturnWarranty: false,
    showSellerChips: false,
  },
}

export function mergeFeatures(
  variant: CardVariant,
  overrides?: Partial<ProductCardFeatures>,
): ProductCardFeatures {
  return { ...VARIANT_FEATURES[variant], ...overrides }
}

export interface ProductCardData {
  _id: string
  id?: string
  slug: string
  title: string
  images: string[]
  videoUrl?: string
  categoryName: string
  subCategory: string
  sku?: string
  price: number
  originalPrice?: number
  unit: string
  rating: number
  reviewCount: number
  viewCount?: number
  savedCount?: number
  monthlyOrders?: number
  isBestseller?: boolean
  priceSlabs?: { minQty: number; maxQty: number | null; price: number }[]
  seller: {
    id?: string
    _id: string
    slug?: string
    businessName: string
    isVerified: boolean
    isTradgoElite?: boolean
    trustScore: number
    avgResponseTime?: string
    yearsActive?: number
    ordersFulfilled?: number
    city: string
    distanceKm?: number
    isGstRegistered?: boolean
    isoCertified?: boolean
  }
  moq: number
  maxOrderQty?: number
  deliveryEta?: string
  freeDeliveryAbove?: number
  stockQty?: number
  inStock: boolean
  specifications?: { key: string; label: string; value: string }[]
  gstInvoiceAvailable?: boolean
  tradeCreditEligible?: boolean
  returnPolicy?: string
  warrantyPeriod?: string
  certifications?: string[]
  keywords?: string[]
}
