'use client'

import { useState, useEffect } from 'react'
import { getFreightAnalytics, type FreightAnalytics } from '@/lib/api/freight-intelligence'
import { Truck, Package, Clock, TrendingUp } from 'lucide-react'

export default function AdminFreightIntelligencePage() {
  const [analytics, setAnalytics] = useState<FreightAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFreightAnalytics({ period: 'monthly' }).then(setAnalytics).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Freight Intelligence</h1>
        <p className="text-sm text-white/50">Carrier analytics, shipping costs, and logistics performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Package size={16} />} label="Total Shipments" value={analytics?.totalShipments} loading={loading} color="#3D8BFF" />
        <StatCard icon={<Truck size={16} />} label="Avg Cost" value={analytics ? `₹${analytics.avgCost}` : '-'} loading={loading} color="#f59e0b" />
        <StatCard icon={<Clock size={16} />} label="Avg Delivery" value={analytics ? `${analytics.avgDeliveryDays}d` : '-'} loading={loading} color="#F2C94C" />
        <StatCard icon={<TrendingUp size={16} />} label="On-Time Rate" value={analytics ? `${analytics.onTimeRate}%` : '-'} loading={loading} color="#4ade80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold text-white mb-3">By Carrier</h2>
          {!analytics?.byCarrier.length ? (
            <p className="text-xs text-white/40">No carrier data</p>
          ) : (
            <div className="space-y-2">
              {analytics.byCarrier.map((c) => (
                <div key={c.carrier} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface">
                  <span className="text-xs text-white/70">{c.carrier}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50">{c.count} shipments</span>
                    <span className="text-xs font-bold text-white">₹{c.avgCost}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold text-white mb-3">By Region</h2>
          {!analytics?.byRegion.length ? (
            <p className="text-xs text-white/40">No region data</p>
          ) : (
            <div className="space-y-2">
              {analytics.byRegion.map((r) => (
                <div key={r.region} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface">
                  <span className="text-xs text-white/70">{r.region}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50">{r.count} shipments</span>
                    <span className="text-xs font-bold text-white">{r.avgDays}d avg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, loading, color }: { icon: React.ReactNode; label: string; value?: number | string; loading: boolean; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] text-white/50 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{loading ? '-' : value ?? '0'}</div>
    </div>
  )
}
