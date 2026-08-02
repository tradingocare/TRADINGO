import api from './client';
import type { DiscoveryResponse, DiscoveryResult, SearchFilters } from '@/types/discovery';

export interface SearchProductsParams {
  q?: string;
  categoryId?: string;
  subCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  verified?: boolean;
  topRated?: boolean;
  inStock?: boolean;
  fastResponse?: boolean;
  sellerType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
  kmRadius?: number;
  city?: string;
  state?: string;
  geoScope?: string;
}

function mapOsHitToDiscoveryResult(hit: Record<string, any>): DiscoveryResult {
  const mediaArr = Array.isArray(hit.media) ? hit.media : [];
  const rawSpecs = Array.isArray(hit.specifications) ? hit.specifications : (hit.specifications && typeof hit.specifications === 'object' ? Object.entries(hit.specifications).map(([key, value]) => ({ key, label: key, value: String(value) })) : []);
  return {
    id: hit.id || '',
    type: 'product',
    name: hit.name || '',
    slug: hit.slug || '',
    images: mediaArr.map((m: any) => m.url || m).filter(Boolean),
    description: hit.shortDescription || hit.description || '',
    categoryName: hit.categoryName || '',
    subCategory: hit.subCategory || undefined,
    isVerified: hit.verificationLevel && hit.verificationLevel !== 'LEVEL_0',
    trustScore: hit.trustScoreSnapshot || 0,
    rating: 0,
    reviewCount: 0,
    responseTime: '',
    distanceKm: undefined,
    geoLabel: undefined,
    geoRing: 0,
    city: hit.city || '',
    state: hit.state || '',
    seller: {
      id: hit.companyId || '',
      name: hit.companyName || '',
      slug: hit.companySlug || undefined,
      isVerified: !!(hit.verificationLevel && hit.verificationLevel !== 'LEVEL_0'),
      trustScore: hit.trustScoreSnapshot || 0,
      isTradgoElite: hit.isTradgoElite || undefined,
      isGstRegistered: !!hit.companyGstRegistered,
      isoCertified: !!hit.companyIsoCertified,
      yearsActive: hit.companyYearsActive ?? undefined,
    },
    price: hit.minPrice != null ? Number(hit.minPrice) : undefined,
    originalPrice: hit.originalPrice != null ? Number(hit.originalPrice) : undefined,
    unit: hit.unit || hit.priceUnit || undefined,
    moq: hit.moq || undefined,
    inStock: hit.status === 'ACTIVE' && hit.inventoryStatus !== 'OUT_OF_STOCK',
    stockQty: hit.availableQuantity != null ? Number(hit.availableQuantity) : undefined,
    priceSlabs: Array.isArray(hit.priceSlabs)
      ? hit.priceSlabs.map((s: any) => ({ minQty: Number(s.minQty), maxQty: s.maxQty != null ? Number(s.maxQty) : null, price: Number(s.price) }))
      : undefined,
    deliveryEta: hit.deliveryEta || undefined,
    deliveryEstimate: undefined,
    freeDeliveryAbove: hit.freeDeliveryAbove != null ? Number(hit.freeDeliveryAbove) : undefined,
    monthlyOrders: hit.monthlyOrders != null ? Number(hit.monthlyOrders) : undefined,
    returnPolicy: hit.returnPolicy || undefined,
    warrantyPeriod: hit.warrantyPeriod || undefined,
    gstInvoiceAvailable: hit.gstInvoiceAvailable ?? undefined,
    tradeCreditEligible: hit.tradeCreditEligible ?? undefined,
    certifications: Array.isArray(hit.certifications) ? hit.certifications : undefined,
    specifications: rawSpecs.length ? rawSpecs : undefined,
    keywords: Array.isArray(hit.catalogKeywords) ? hit.catalogKeywords : undefined,
    brand: hit.brand || undefined,
    listedDate: hit.createdAt || undefined,
  };
}

export interface DiscoveryFeedItem {
  type: 'product' | 'company' | 'category' | 'deal'
  data: Record<string, any>
  reason: string
  dealType?: string
}

export interface DiscoveryFeedResponse {
  items: DiscoveryFeedItem[]
  meta: { total: number; page: number; limit: number }
}

export function getDiscoveryFeed(page = 1, limit = 50): Promise<DiscoveryFeedResponse> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 50);
  return api.get(`/discover?page=${safePage}&limit=${safeLimit}`).then(r => (r as any).data);
}

export function discoverItemToDiscoveryResult(item: DiscoveryFeedItem): DiscoveryResult | null {
  if (item.type !== 'product' && item.type !== 'deal') return null;
  const hit = item.data || {};
  if (!hit.id && !hit.name) return null;
  return mapOsHitToDiscoveryResult(hit);
}

export function searchProducts(params: SearchProductsParams): Promise<DiscoveryResponse> {
  const qp = new URLSearchParams();
  if (params.q) qp.set('q', params.q);
  if (params.categoryId) qp.set('categoryId', params.categoryId);
  if (params.subCategory) qp.set('subCategory', params.subCategory);
  if (params.minPrice !== undefined) qp.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qp.set('maxPrice', String(params.maxPrice));
  if (params.minMoq !== undefined) qp.set('minMoq', String(params.minMoq));
  if (params.verified) qp.set('verified', 'true');
  if (params.topRated) qp.set('topRated', 'true');
  if (params.inStock) qp.set('inStock', 'true');
  if (params.fastResponse) qp.set('fastResponse', 'true');
  if (params.sellerType) qp.set('sellerType', params.sellerType);
  if (params.sortBy) qp.set('sort', params.sortBy);
  if (params.page) qp.set('page', String(params.page));
  if (params.limit) qp.set('limit', String(params.limit));
  if (params.lat !== undefined) qp.set('lat', String(params.lat));
  if (params.lng !== undefined) qp.set('lng', String(params.lng));
  if (params.kmRadius !== undefined) qp.set('kmRadius', String(params.kmRadius));
  if (params.city) qp.set('city', params.city);
  if (params.state) qp.set('state', params.state);
  if (params.geoScope && params.geoScope !== 'pan_india') qp.set('geoScope', params.geoScope);

  return api.get(`/search/products?${qp}`).then(r => {
    const raw = (r as any).data;
    if (!raw || !Array.isArray(raw.hits)) {
      return { results: [], total: 0, page: params.page || 1, pages: 0, geoBreakdown: [], meta: { query: '', language: 'en', fromCache: false, responseMs: 0 } };
    }
    const limit = params.limit || 24;
    return {
      results: raw.hits.map(mapOsHitToDiscoveryResult),
      total: raw.total || 0,
      page: raw.page || 1,
      pages: Math.ceil((raw.total || 0) / limit),
      geoBreakdown: [],
      meta: { query: params.q || '', language: 'en', fromCache: false, responseMs: 0 },
    } as DiscoveryResponse;
  });
}

export type { DiscoveryResponse };
