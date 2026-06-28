'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { Loader2, TrendingUp, Eye, Heart, ShoppingCart, Package, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>({})
  const [products, setProducts] = useState<any[]>([])
  const [performance, setPerformance] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/seller/analytics/overview'),
      api.get('/seller/analytics/products'),
      api.get('/seller/analytics/performance'),
    ]).then(([o, p, perf]) => {
      setOverview(o.data || {})
      setProducts(p.data?.data || p.data || [])
      setPerformance(perf.data || {})
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 size={24} className="animate-spin text-orange-500" /></div>

  const statCards = [
    { label: 'Total Products', value: overview.totalProducts || 0, icon: Package, color: 'blue' },
    { label: 'Active Products', value: overview.activeProducts || 0, icon: BarChart3, color: 'green' },
    { label: 'Total Views', value: (overview.totalViews || 0).toLocaleString(), icon: Eye, color: 'purple' },
    { label: 'Total Saved', value: (overview.totalSaved || 0).toLocaleString(), icon: Heart, color: 'red' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Product Analytics</h1>
        <p className="text-sm text-gray-500">Performance metrics for your products</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${card.color}-50 text-${card.color}-500`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top Viewed Products</h3>
          <div className="space-y-3">
            {(performance.topByViews || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 truncate flex-1">{p.name}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400"><Eye size={12} className="inline mr-1" />{p.viewCount}</span>
                  <span className="text-xs text-gray-400"><Heart size={12} className="inline mr-1" />{p.savedCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top Ordered</h3>
          <div className="space-y-3">
            {(performance.topByOrders || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 truncate flex-1">{p.name}</p>
                <span className="text-xs font-bold text-orange-500"><ShoppingCart size={12} className="inline mr-1" />{p.monthlyOrders} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Product Performance</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {products.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {p.media?.[0]?.url ? <img src={p.media[0].url} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span title="Views"><Eye size={12} className="inline mr-1" />{p.viewCount}</span>
                <span title="Saved"><Heart size={12} className="inline mr-1" />{p.savedCount}</span>
                <span title="Orders"><ShoppingCart size={12} className="inline mr-1" />{p.monthlyOrders}</span>
              </div>
            </div>
          ))}
          {products.length === 0 && <div className="py-10 text-center text-sm text-gray-400">No active products yet</div>}
        </div>
      </div>
    </div>
  )
}
