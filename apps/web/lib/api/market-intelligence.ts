import api from './client'

export interface MarketTrend {
  categoryId: string
  categoryName: string
  totalRfqs: number
  totalOrders: number
  avgOrderValue: number
  topSuppliers: number
  demandTrend: 'RISING' | 'STABLE' | 'DECLINING'
  priceRange: { min: number; max: number }
}

export interface DemandSignal {
  productName: string
  rfqCount: number
  searchCount: number
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  emerging: boolean
}

export async function getMarketTrends(params?: { period?: string; limit?: number }): Promise<MarketTrend[]> {
  const query = new URLSearchParams()
  if (params?.period) query.set('period', params.period)
  if (params?.limit) query.set('limit', String(params.limit))
  const res = await api.get(`/market-intelligence/trends?${query}`)
  return res.data
}

export async function getDemandSignals(params?: { categoryId?: string; limit?: number }): Promise<DemandSignal[]> {
  const query = new URLSearchParams()
  if (params?.categoryId) query.set('categoryId', params.categoryId)
  if (params?.limit) query.set('limit', String(params.limit))
  const res = await api.get(`/market-intelligence/demand-signals?${query}`)
  return res.data
}
