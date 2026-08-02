import api from './client'

export interface FreightEstimate {
  distanceKm: number
  estimatedCost: number
  currency: string
  estimatedDays: number
  confidence: number
  carrierOptions: Array<{
    carrierId: string
    carrierName: string
    cost: number
    estimatedDays: number
    serviceType: string
  }>
}

export interface FreightAnalytics {
  totalShipments: number
  avgCost: number
  avgDeliveryDays: number
  onTimeRate: number
  byCarrier: Array<{ carrier: string; count: number; avgCost: number }>
  byRegion: Array<{ region: string; count: number; avgDays: number }>
}

export async function estimateFreight(params: {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  weight?: number
  shipmentType?: string
  packages?: number
}): Promise<FreightEstimate> {
  const res = await api.post('/freight-intelligence/estimate', params)
  return res.data
}

export async function getFreightAnalytics(params?: { period?: string; limit?: number }): Promise<FreightAnalytics> {
  const query = new URLSearchParams()
  if (params?.period) query.set('period', params.period)
  if (params?.limit) query.set('limit', String(params.limit))
  const res = await api.get(`/freight-intelligence/analytics?${query}`)
  return res.data
}
