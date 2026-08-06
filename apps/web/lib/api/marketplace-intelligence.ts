import api from './client'

export interface BestSupplierResult {
  companyId: string
  companyName: string
  slug: string
  logo: string | null
  totalScore: number
  factors: {
    distance: number
    distanceScore: number
    tradTrustScore: number
    priceCompetitiveness: number
    deliveryReliability: number
    responseRate: number
    completionRate: number
    sellerRating: number
    financialHealth: number
    relationshipScore: number
    aiConfidence: number
    availability: number
    negotiationSuccess: number
    rfqSuccess: number
    verificationLevel: number
  }
  recommendation: 'BEST' | 'STRONG' | 'GOOD' | 'AVERAGE' | 'POOR'
}

export interface FactorDetail {
  score: number
  weight: number
  contribution: number
  label: string
  reason: string
}

export interface UnifiedScoreResult {
  companyId: string
  companyName: string
  unifiedScore: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'
  factors: FactorDetail[]
  recommendation: 'BEST' | 'STRONG' | 'GOOD' | 'AVERAGE' | 'POOR'
}

export interface NearFarResult {
  suppliers: any[]
  expansionLevel: string
  radiusUsed: number
  totalFound: number
}

export interface BuyerRecommendationResult {
  type: 'supplier' | 'product' | 'category' | 'cross_sell' | 'upsell'
  item: any
  reason: string
  score: number
}

export interface SellerRecommendationResult {
  type: 'potential_buyer' | 'growing_market' | 'trending_product' | 'expansion_city' | 'nearby_buyer' | 'repeat_buyer'
  item: any
  reason: string
  score: number
}

export interface RankingEntry {
  rank: number
  id: string
  name: string
  score: number
  slug?: string
  logo?: string | null
  change?: 'up' | 'down' | 'stable'
}

export interface MarketplaceRankings {
  suppliers: RankingEntry[]
  buyers: RankingEntry[]
  products: RankingEntry[]
  categories: RankingEntry[]
  cities: RankingEntry[]
  industries: RankingEntry[]
  states: RankingEntry[]
}

export interface GeoIntelligenceResult {
  demandHeatmap: Array<{ lat: number; lng: number; weight: number; label: string }>
  supplierDensity: Array<{ state: string; count: number; verifiedCount: number }>
  buyerDensity: Array<{ state: string; count: number }>
  categoryDensity: Array<{ category: string; count: number; percentage: number }>
  rmCoverage: Array<{ rmId: string; rmName: string; companyCount: number; stateCoverage: string[] }>
}

export interface BusinessIntelligenceResult {
  expansionCities: Array<{ city: string; state: string; demandScore: number; competitionScore: number; recommendation: string }>
  warehouseLocations: Array<{ city: string; state: string; score: number; reason: string }>
  advertisingCities: Array<{ city: string; state: string; score: number; audienceSize: string }>
}

export interface RelationshipIntelligence {
  relationshipScore: number
  totalOrders: number
  totalRfqs: number
  totalQuotes: number
  totalNegotiations: number
  completedOrders: number
  disputes: number
  firstInteraction: Date | null
  lastInteraction: Date | null
  averageOrderValue: number
  recommendation: string
}

export interface DeliveryPrediction {
  estimatedDeliveryDate: string
  confidence: number
  delayRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  transitDays: number
  factors: Array<{ name: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }>
}

export async function getBestSuppliers(params: {
  lat?: number
  lng?: number
  radius?: number
  categoryId?: string
  limit?: number
}): Promise<BestSupplierResult[]> {
  const query = new URLSearchParams()
  if (params.lat !== undefined) query.set('lat', String(params.lat))
  if (params.lng !== undefined) query.set('lng', String(params.lng))
  if (params.radius !== undefined) query.set('radius', String(params.radius))
  if (params.categoryId) query.set('categoryId', params.categoryId)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  const res = await api.get(`/marketplace-intelligence/best-suppliers?${query}`)
  return res.data
}

export async function recordMarketplaceEvent(body: {
  buyerId: string
  buyerCompany?: string
  productId?: string
  categoryId?: string
  sellerId?: string
  eventType: string
  query?: string
  rating?: number
  amount?: number
}): Promise<void> {
  await api.post('/marketplace-intelligence/record-event', body)
}

export async function getGeoClusters(entityType?: string, period?: string) {
  const query = new URLSearchParams()
  if (entityType) query.set('entityType', entityType)
  if (period) query.set('period', period)
  const res = await api.get(`/location-intelligence/clusters?${query}`)
  return res.data as Array<{ latitude: number; longitude: number; count: number; clusterType: string }>
}

export async function getLocationSummary() {
  const res = await api.get('/location-intelligence/summary')
  return res.data as {
    totalLocations: number
    geocoded: number
    unlocated: number
    gpsCapture: number
    adminVerified: number
    autoGeocoded: number
  }
}

export async function getUnifiedScore(companyId: string): Promise<UnifiedScoreResult> {
  const res = await api.get(`/marketplace-intelligence/score/${companyId}`)
  return res.data
}

export async function findSuppliersWithExpansion(params: {
  lat: number
  lng: number
  categoryId?: string
  buyerId?: string
  productId?: string
  limit?: number
}): Promise<NearFarResult> {
  const query = new URLSearchParams()
  query.set('lat', String(params.lat))
  query.set('lng', String(params.lng))
  if (params.categoryId) query.set('categoryId', params.categoryId)
  if (params.buyerId) query.set('buyerId', params.buyerId)
  if (params.productId) query.set('productId', params.productId)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  const res = await api.get(`/marketplace-intelligence/near-far-suppliers?${query}`)
  return res.data
}

export async function getBuyerRecommendations(buyerId: string, companyId: string, limit = 10): Promise<BuyerRecommendationResult[]> {
  const res = await api.get(`/marketplace-intelligence/buyer-recommendations?buyerId=${buyerId}&companyId=${companyId}&limit=${limit}`)
  return res.data
}

export async function getSellerRecommendations(companyId: string, limit = 10): Promise<SellerRecommendationResult[]> {
  const res = await api.get(`/marketplace-intelligence/seller-recommendations?companyId=${companyId}&limit=${limit}`)
  return res.data
}

export async function getMarketplaceRankings(): Promise<MarketplaceRankings> {
  const res = await api.get('/marketplace-intelligence/rankings')
  return res.data
}

export async function getGeoIntelligence(): Promise<GeoIntelligenceResult> {
  const res = await api.get('/marketplace-intelligence/geo-intelligence')
  return res.data
}

export async function getBusinessIntelligence(companyId: string): Promise<BusinessIntelligenceResult> {
  const res = await api.get(`/marketplace-intelligence/business-intelligence?companyId=${companyId}`)
  return res.data
}

export async function getBuyerRelationshipIntelligence(buyerId: string, sellerId: string): Promise<RelationshipIntelligence> {
  const res = await api.get(`/marketplace-intelligence/relationship?buyerId=${buyerId}&sellerId=${sellerId}`)
  return res.data
}

export async function getDeliveryPrediction(params: {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  weightKg?: number
  courier?: string
}): Promise<DeliveryPrediction> {
  const res = await api.post('/marketplace-intelligence/delivery-prediction', params)
  return res.data
}

export async function getRelationshipScore(buyerId: string, sellerId: string): Promise<number> {
  const res = await api.get(`/marketplace-intelligence/relationship-score?buyerId=${buyerId}&sellerId=${sellerId}`)
  return res.data
}
