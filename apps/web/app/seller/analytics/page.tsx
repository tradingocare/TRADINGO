'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { toast } from '@/components/ui/use-toast'
import { TrendingUp, Eye, Heart, ShoppingCart, Package, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
    }).catch(() => {
      toast({ title: 'Failed to load analytics', variant: 'destructive' });
    })
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner size="xl" />

  const statCards = [
    { label: 'Total Products', value: overview.totalProducts || 0, icon: Package, color: 'blue' },
    { label: 'Active Products', value: overview.activeProducts || 0, icon: BarChart3, color: 'green' },
    { label: 'Total Views', value: (overview.totalViews || 0).toLocaleString(), icon: Eye, color: 'purple' },
    { label: 'Total Saved', value: (overview.totalSaved || 0).toLocaleString(), icon: Heart, color: 'red' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Product Analytics</h1>
        <p className="text-sm text-white/50">Performance metrics for your products</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="rounded-[22px] p-5 bg-bg-elevated border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{card.label}</p>
                <Icon size={16} className="text-accent-500" />
              </div>
              <p className="text-2xl font-black text-white">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[22px] p-5 bg-bg-elevated border border-border">
          <h3 className="text-sm font-bold text-white mb-4">Top Viewed Products</h3>
          <div className="space-y-3">
            {(performance.topByViews || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white/70 truncate flex-1">{p.name}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/40"><Eye size={12} className="inline mr-1" />{p.viewCount}</span>
                  <span className="text-xs text-white/40"><Heart size={12} className="inline mr-1" />{p.savedCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] p-5 bg-bg-elevated border border-border">
          <h3 className="text-sm font-bold text-white mb-4">Top Ordered</h3>
          <div className="space-y-3">
            {(performance.topByOrders || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white/70 truncate flex-1">{p.name}</p>
                <span className="text-xs font-bold text-accent-500"><ShoppingCart size={12} className="inline mr-1" />{p.monthlyOrders} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[22px] overflow-hidden bg-bg-elevated border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-white">Product Performance</h3>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {products.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center overflow-hidden shrink-0">
                {p.media?.[0]?.url ? <img src={p.media[0].url} alt={p.name} className="w-full h-full object-cover" /> : <Package size={14} className="text-white/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                <p className="text-xs text-white/40">{p.category?.name || ''}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-white/40"><Eye size={12} className="inline mr-1" />{p.viewCount || 0}</span>
                <span className="text-white/40"><Heart size={12} className="inline mr-1" />{p.savedCount || 0}</span>
                <span className="text-white/40"><ShoppingCart size={12} className="inline mr-1" />{p.orderCount || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
