import type { ProductCardModel, ProductCardData } from '@/types/product-card'
import type { DiscoveryResult } from '@/types/discovery'
import type { NearMeProduct } from '@/lib/api/near-me'
import type { WishlistItem } from '@/lib/api/products'

/**
 * R1 display-price derivation. The Product model has NO base price
 * column — the authoritative unit price lives on price slabs, so the
 * display price is the first slab's unit price (minQty ascending,
 * i.e. the price at MOQ). `originalPrice` is a real vendor-declared
 * reference price (display-only, never transactional) and is the
 * established fallback when a product has no slabs. No price is ever
 * invented: products with neither fall back to 0, which the
 * authoritative pricing endpoint reports as not purchasable.
 */
function authoritativeDisplayPrice(
  slabs?: { minQty: number; maxQty: number | null; price?: number | string | null }[] | null,
  originalPrice?: number | null,
): number {
  if (slabs && slabs.length > 0) {
    const first = [...slabs].sort((a, b) => a.minQty - b.minQty)[0]
    const price = Number(first?.price)
    if (Number.isFinite(price) && price > 0) return price
  }
  if (originalPrice != null && Number.isFinite(originalPrice) && originalPrice > 0) return originalPrice
  return 0
}

/**
 * R4 authoritative rating. A rating is only meaningful with at least one
 * approved review behind it, on the canonical 1–5 scale
 * (ReviewsService.getReviewStats, APPROVED reviews only). Anything else —
 * trust scores (0–100), absent data, out-of-scale values, review-less
 * numbers — resolves to no rating (0/0), which hides the locked card's
 * rating chip (it renders only when rating > 0 && reviewCount > 0).
 */
function authoritativeRating(
  rating?: number | string | null,
  reviewCount?: number | string | null,
): { rating: number; reviewCount: number } {
  const value = Number(rating);
  const count = Number(reviewCount);
  if (!Number.isFinite(value) || value < 0 || value > 5 || !Number.isInteger(count) || count <= 0) {
    return { rating: 0, reviewCount: 0 };
  }
  return { rating: value, reviewCount: count };
}

/**
 * R4 authoritative stock. `inStock` is true ONLY when availability is
 * affirmatively established: an explicit authoritative boolean, an
 * IN_STOCK/LOW_STOCK inventory status, or a positive on-hand quantity.
 * Unknown stock resolves to false — the locked card renders that as Out
 * of Stock and disables purchase, which is the safe state for unverified
 * availability. Never derive availability from price slabs, product
 * status, or seller attributes.
 */
function authoritativeInStock(source?: {
  inStock?: unknown;
  stockStatus?: unknown;
  inventory?: { availableQuantity?: number | string | null; stockStatus?: string | null } | null;
  availableQuantity?: number | string | null;
  stock?: number | string | null;
} | null): boolean {
  if (source == null) return false;
  if (typeof source.inStock === 'boolean') return source.inStock;
  const status = source.stockStatus ?? source.inventory?.stockStatus ?? null;
  if (typeof status === 'string') return status === 'IN_STOCK' || status === 'LOW_STOCK';
  const qty = source.availableQuantity ?? source.inventory?.availableQuantity ?? source.stock ?? null;
  if (qty == null) return false;
  return Number(qty) > 0;
}

export function fromDiscoveryResult(dr: DiscoveryResult): ProductCardModel {
  // dr.price is the search-index minimum price (first slab by
  // minQty) — authoritative; slabs/originalPrice are the fallbacks.
  const price = dr.price ?? authoritativeDisplayPrice(dr.priceSlabs, dr.originalPrice)
  // The discovery mapper carries no review stats (rating 0 / count 0);
  // real approved-review stats flow through unchanged when present.
  const { rating, reviewCount } = authoritativeRating(dr.rating, dr.reviewCount)
  return {
    id: dr.id,
    slug: dr.slug,
    title: dr.name,
    description: dr.description || undefined,
    images: dr.images?.length ? dr.images : ['/placeholder-product.jpg'],
    categoryName: dr.categoryName,
    subCategory: dr.subCategory,
    price,
    originalPrice: dr.originalPrice,
    unit: dr.unit ?? 'unit',
    moq: dr.moq ?? 1,
    maxOrderQty: undefined,
    priceSlabs: dr.priceSlabs,
    seller: {
      id: dr.seller.id,
      name: dr.seller.name,
      slug: dr.seller.slug,
      isVerified: dr.seller.isVerified,
      trustScore: dr.seller.trustScore,
      isTradgoElite: dr.seller.isTradgoElite,
      isGstRegistered: dr.seller.isGstRegistered,
      isoCertified: dr.seller.isoCertified,
      yearsActive: dr.seller.yearsActive,
      city: dr.city,
      avgResponseTime: dr.responseTime,
    },
    rating,
    reviewCount,
    monthlyOrders: dr.monthlyOrders,
    isBestseller: undefined,
    viewCount: undefined,
    savedCount: undefined,
    // The discovery mapper derives this from product status +
    // inventory status (authoritative). Unknown resolves to
    // unavailable — never assumed available.
    inStock: dr.inStock ?? false,
    stockQty: dr.stockQty,
    deliveryEta: dr.deliveryEta,
    deliveryEstimate: dr.deliveryEstimate,
    freeDeliveryAbove: dr.freeDeliveryAbove,
    returnPolicy: dr.returnPolicy,
    warrantyPeriod: dr.warrantyPeriod,
    certifications: dr.certifications,
    specifications: dr.specifications,
    keywords: dr.keywords ?? (dr as any).focusKeywords,
    gstInvoiceAvailable: dr.gstInvoiceAvailable,
    tradeCreditEligible: dr.tradeCreditEligible,
    listedDate: dr.listedDate,
    distanceKm: dr.distanceKm,
    geoLabel: dr.geoLabel,
    // R4: no per-price GOCASH earn rate exists. The authoritative reward
    // is a flat Rs.50 on order completion (+ milestones), which is an
    // order-lifecycle event — not a per-product display value. Absent
    // hides the locked card's chip.
    gocashEarn: undefined,
    trustScoreSnapshot: dr.trustScore,
    isPremium: dr.seller.isTradgoElite,
    isTradgo: undefined,
    type: dr.type === 'company' ? 'product' : dr.type,
    brand: dr.brand,
  }
}

export function fromNearMeProduct(np: NearMeProduct): ProductCardModel {
  return {
    id: np.productId || np.id,
    slug: np.slug,
    title: np.name,
    // Authoritative vendor short description. Hidden when absent.
    description: np.shortDescription || undefined,
    images: np.imageUrl ? [np.imageUrl] : [],
    categoryName: np.categoryName || '',
    price: np.price ?? 0,
    originalPrice: undefined,
    unit: np.unit ?? 'unit',
    // R5: defensive default — the locked card calls toLocaleString on MOQ,
    // so an absent value must not reach it as undefined. No behavior change
    // when the API provides MOQ (schema: required with default 1).
    moq: np.moq ?? 1,
    seller: {
      id: np.seller.id,
      name: np.seller.name,
      slug: np.seller.slug,
      isVerified: np.seller.isVerified,
      trustScore: np.seller.trustScore,
      isTradgoElite: np.seller.isElite,
      isGstRegistered: np.seller.gstVerified,
      isoCertified: undefined,
      yearsActive: np.seller.yearsActive,
      city: np.seller.city,
      avgResponseTime: np.seller.avgResponseTime,
      logo: np.seller.logo,
    },
    // R4: NearMeProduct carries no product review data (the API hardcodes
    // seller.rating 0 and no review count) — no rating is shown until
    // real approved-review stats are plumbed through.
    rating: 0,
    reviewCount: 0,
    // R4: NearMeProduct carries no inventory data, so availability is
    // unknown and must not present as In Stock. Backend dependency:
    // expose inventory/stockStatus on the near-me response to enable
    // purchase for these cards.
    inStock: false,
    deliveryEta: np.deliveryEta ?? undefined,
    distanceKm: np.distanceKm,
    geoLabel: np.distanceLabel,
    gocashEarn: undefined,
    trustScoreSnapshot: np.trustScore,
    isPremium: np.seller.isElite,
    isTradgo: np.isTradgo,
    type: 'product',
  }
}

export function fromEnrichedProduct(ep: any): ProductCardModel {
  const price = authoritativeDisplayPrice(ep.priceSlabs, ep.originalPrice)
  // R4: trust scores (0–100) must never become a 1–5 rating. Only real
  // approved-review stats pass; everything else resolves to no rating.
  const { rating, reviewCount } = authoritativeRating(ep.rating, ep.reviewCount)
  const media = ep.media || []
  const images = media
    .filter((m: any) => m.type === 'IMAGE')
    .map((m: any) => m.url)
  const category = ep.category?.name || ep.categoryName || ''
  const company = ep.company || {}
  return {
    id: ep.id,
    slug: ep.slug,
    title: ep.name,
    sku: ep.sku || undefined,
    // Authoritative vendor texts. Hidden when absent — never synthesized.
    description: ep.shortDescription || ep.description || undefined,
    images: images.length ? images : [],
    categoryName: typeof ep.category === 'object' ? ep.category?.name : ep.categoryName || '',
    subCategory: ep.subCategory,
    brand: ep.brand,
    price,
    originalPrice: ep.originalPrice,
    unit: ep.unit || 'unit',
    moq: ep.moq || 1,
    priceSlabs: ep.priceSlabs,
    seller: {
      id: company.id || ep.companyId,
      name: company.name || '',
      slug: company.slug,
      isVerified: (company.verificationLevel && company.verificationLevel !== 'LEVEL_0') || false,
      trustScore: company.trustScore || ep.trustScoreSnapshot || 0,
      isGstRegistered: company.isGstRegistered ?? (!!company.gstNumber || !!ep.gstInvoiceAvailable),
      isoCertified: company.isoCertified,
      yearsActive: company.yearsActive,
      city: company.city,
      // Authoritative Company.businessType. Hidden when absent.
      businessType: company.businessType || undefined,
    },
    rating,
    reviewCount,
    // R4: availability comes from inventory data only. Product status
    // (ACTIVE/PUBLISHED) and slab presence say nothing about stock and
    // must not imply it.
    inStock: authoritativeInStock({ stockStatus: ep.stockStatus, inventory: ep.inventory, stock: ep.stock }),
    stockQty: ep.stock ?? ep.inventory?.availableQuantity,
    deliveryEta: ep.deliveryEta,
    freeDeliveryAbove: ep.freeDeliveryAbove,
    returnPolicy: ep.returnPolicy,
    warrantyPeriod: ep.warrantyPeriod ? `${ep.warrantyPeriod} months` : undefined,
    certifications: ep.certifications,
    specifications: ep.specifications?.map((s: any) => ({ key: s.key, label: s.key, value: s.value })),
    gstInvoiceAvailable: ep.gstInvoiceAvailable,
    tradeCreditEligible: ep.tradeCreditEligible,
    listedDate: ep.createdAt,
    trustScoreSnapshot: ep.trustScoreSnapshot,
    gocashEarn: undefined,
    isBestseller: ep.isBestseller || ep.isFeatured,
    monthlyOrders: ep.monthlyOrders,
    isPremium: company.isTradgoElite,
    type: 'product',
  }
}

export function fromProductCardData(pcd: ProductCardData): ProductCardModel {
  const price = authoritativeDisplayPrice(pcd.priceSlabs, pcd.originalPrice)
  // R4: the ProductCardData constructor carries honest 0/0 when no review
  // stats exist; the helper additionally guards against any contaminated
  // (e.g. trust-score-scale) value a future constructor might set.
  const { rating, reviewCount } = authoritativeRating(pcd.rating, pcd.reviewCount)
  return {
    id: pcd._id,
    slug: pcd.slug,
    title: pcd.title,
    sku: pcd.sku,
    images: pcd.images,
    videoUrl: pcd.videoUrl,
    categoryName: pcd.categoryName,
    subCategory: pcd.subCategory,
    brand: undefined,
    price,
    originalPrice: pcd.originalPrice,
    unit: pcd.unit,
    moq: pcd.moq,
    maxOrderQty: pcd.maxOrderQty,
    priceSlabs: pcd.priceSlabs,
    seller: {
      id: pcd.seller.id || pcd.seller._id,
      name: pcd.seller.businessName,
      slug: pcd.seller.slug,
      isVerified: pcd.seller.isVerified,
      trustScore: pcd.seller.trustScore,
      isTradgoElite: pcd.seller.isTradgoElite,
      isGstRegistered: pcd.seller.isGstRegistered,
      isoCertified: pcd.seller.isoCertified,
      yearsActive: pcd.seller.yearsActive,
      city: pcd.seller.city,
      avgResponseTime: pcd.seller.avgResponseTime,
    },
    rating,
    reviewCount,
    monthlyOrders: pcd.monthlyOrders,
    isBestseller: pcd.isBestseller,
    savedCount: pcd.savedCount,
    viewCount: pcd.viewCount,
    inStock: pcd.inStock,
    stockQty: pcd.stockQty,
    deliveryEta: pcd.deliveryEta,
    freeDeliveryAbove: pcd.freeDeliveryAbove,
    distanceKm: pcd.seller.distanceKm,
    gocashEarn: undefined,
    trustScoreSnapshot: pcd.seller.trustScore,
    isPremium: pcd.seller.isTradgoElite,
    gstInvoiceAvailable: pcd.gstInvoiceAvailable,
    tradeCreditEligible: pcd.tradeCreditEligible,
    returnPolicy: pcd.returnPolicy,
    warrantyPeriod: pcd.warrantyPeriod,
    certifications: pcd.certifications,
    specifications: pcd.specifications,
    type: 'product',
  }
}

export function fromBasicProduct(bp: any): ProductCardModel {
  const price = authoritativeDisplayPrice(bp.priceSlabs, bp.originalPrice)
  // R4: same rule as enriched — only real approved-review stats pass.
  const { rating, reviewCount } = authoritativeRating(bp.rating, bp.reviewCount)
  return {
    id: bp.id,
    slug: bp.slug || bp.id,
    title: bp.name,
    // Authoritative vendor texts/classification. Hidden when absent.
    description: bp.shortDescription || bp.description || undefined,
    images: bp.image ? [bp.image] : [],
    categoryName: bp.categoryName || (typeof bp.category === 'string' ? bp.category : bp.category?.name || ''),
    subCategory: bp.subCategory || (typeof bp.subCategory === 'string' ? bp.subCategory : undefined),
    brand: bp.brand || undefined,
    price,
    originalPrice: bp.originalPrice,
    unit: bp.unit || 'unit',
    moq: bp.moq || 1,
    seller: {
      id: bp.companyId || bp.seller?.id || '',
      name: bp.companyName || bp.seller?.name || '',
      slug: bp.companySlug || bp.seller?.slug,
      isVerified: bp.isVerified || bp.seller?.isVerified || false,
      trustScore: bp.trustScore || bp.seller?.trustScore || 0,
      isGstRegistered: bp.seller?.isGstRegistered ?? (!!bp.gstNumber || !!bp.gstInvoiceAvailable),
      isoCertified: bp.seller?.isoCertified,
      yearsActive: bp.seller?.yearsActive,
      city: bp.city || bp.seller?.city,
      // Authoritative Company.businessType. Hidden when absent.
      businessType: bp.businessType || bp.seller?.businessType || undefined,
    },
    rating,
    reviewCount,
    // R4: slab presence says nothing about stock. Availability comes
    // from an explicit boolean or inventory data only.
    inStock: authoritativeInStock({
      inStock: bp.inStock,
      inventory: bp.inventory,
      availableQuantity: bp.availableQuantity,
      stock: bp.stock,
    }),
    stockQty: bp.stock,
    deliveryEta: bp.deliveryEta,
    freeDeliveryAbove: bp.freeDeliveryAbove,
    returnPolicy: bp.returnPolicy,
    warrantyPeriod: bp.warrantyPeriod,
    certifications: bp.certifications,
    gstInvoiceAvailable: bp.gstInvoiceAvailable,
    tradeCreditEligible: bp.tradeCreditEligible,
    gocashEarn: undefined,
    isBestseller: bp.isBestseller,
    trustScoreSnapshot: bp.trustScoreSnapshot,
    monthlyOrders: bp.monthlyOrders,
    type: 'product',
  }
}

export function fromWishlistItem(w: WishlistItem): ProductCardModel {
  const p = w.product
  // The wishlist API normalizes products with priceSlabs but never
  // populates a base price (no such column) — derive the display
  // price from the first slab instead of fabricating ₹0.
  const price = authoritativeDisplayPrice(p.priceSlabs, p.originalPrice)
  // R4: the wishlist payload carries no review stats — no rating shown.
  const { rating, reviewCount } = authoritativeRating(p.rating, p.reviewCount)
  return {
    id: p.id,
    slug: p.slug,
    title: p.name,
    // Authoritative vendor short description. Hidden when absent.
    description: p.shortDescription || p.description || undefined,
    images: p.images?.length ? p.images : ['/placeholder-product.jpg'],
    videoUrl: p.videoUrl,
    categoryName: p.categoryName || '',
    price,
    originalPrice: p.originalPrice,
    unit: p.unit || 'unit',
    moq: p.moq || 1,
    seller: {
      id: p.seller.id,
      name: p.seller.name,
      slug: p.seller.slug,
      isVerified: p.seller.isVerified,
      trustScore: p.seller.trustScore,
      isTradgoElite: p.seller.isTradgoElite,
      isGstRegistered: p.seller.gstVerified,
      isoCertified: undefined,
      yearsActive: p.seller.yearsActive,
      city: p.seller.city,
      avgResponseTime: p.seller.avgResponseTime,
      logo: p.seller.logo,
    },
    rating,
    reviewCount,
    monthlyOrders: p.monthlyOrders,
    isBestseller: p.isBestseller,
    // R4: the wishlist API includes the product inventory row — map real
    // availability (and the on-hand count) instead of an assumed state.
    inStock: authoritativeInStock({ inventory: p.inventory }),
    stockQty: p.inventory?.availableQuantity ?? undefined,
    deliveryEta: p.deliveryEta,
    freeDeliveryAbove: p.freeDeliveryAbove,
    returnPolicy: p.returnPolicy,
    warrantyPeriod: p.warrantyPeriod,
    certifications: p.certifications,
    gocashEarn: undefined,
    trustScoreSnapshot: p.seller.trustScore,
    isPremium: p.seller.isTradgoElite,
    type: 'product',
  }
}
