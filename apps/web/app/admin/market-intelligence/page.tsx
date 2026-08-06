'use client'

import { useState, useEffect } from 'react'
import { getMarketTrends, getDemandSignals, type MarketTrend, type DemandSignal } from '@/lib/api/market-intelligence'
import { TrendingUp, TrendingDown, Minus, AlertCircle, Package } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, THead, TR, TH, TBody, TD } from '@/components/ui/table'

export default function AdminMarketIntelligencePage() {
  const [trends, setTrends] = useState<MarketTrend[]>([])
  const [signals, setSignals] = useState<DemandSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMarketTrends({ period: 'monthly', limit: 20 }),
      getDemandSignals({ limit: 20 }),
    ]).then(([t, s]) => {
      setTrends(t)
      setSignals(s)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
        <p className="text-sm text-white/50">Category trends, demand signals, and pricing intelligence</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={14} style={{ color: '#f59e0b' }} />
          Category Trends
        </h2>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : !trends.length ? (
          <EmptyState variant="empty" title="No trend data yet" className="!bg-transparent !border-0" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <THead>
                <TR><TH>Category</TH><TH>RFQs</TH><TH>Orders</TH><TH>Avg Value</TH><TH>Demand</TH><TH>Price Range</TH></TR>
              </THead>
              <TBody>
                {trends.map((t) => (
                  <TR key={t.categoryId}>
                    <TD className="text-white font-medium">{t.categoryName}</TD>
                    <TD className="text-white/70">{t.totalRfqs}</TD>
                    <TD className="text-white/70">{t.totalOrders}</TD>
                    <TD className="text-white/70">?{t.avgOrderValue.toLocaleString()}</TD>
                    <TD>
                      {t.demandTrend === 'RISING' ? (
                        <span className="flex items-center gap-1 text-emerald-400"><TrendingUp size={12} /> Rising</span>
                      ) : t.demandTrend === 'DECLINING' ? (
                        <span className="flex items-center gap-1 text-red-400"><TrendingDown size={12} /> Declining</span>
                      ) : (
                        <span className="flex items-center gap-1 text-white/50"><Minus size={12} /> Stable</span>
                      )}
                    </TD>
                    <TD className="text-white/60">₹{t.priceRange.min.toLocaleString()} - ₹{t.priceRange.max.toLocaleString()}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <AlertCircle size={14} style={{ color: '#F2C94C' }} />
          Demand Signals (Last 7 Days)
        </h2>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : !signals.length ? (
          <p className="text-xs text-white/40 py-4 text-center">No demand signals yet</p>
        ) : (
          <div className="space-y-1">
            {signals.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface">
                <div className="flex items-center gap-2">
                  <Package size={12} className="text-white/40" />
                  <span className="text-xs text-white">{s.productName}</span>
                  {s.emerging && <span className="text-[9px] px-1 py-0.5 rounded-full bg-amber-400/20 text-accent-500 font-bold">NEW</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50">{s.rfqCount} RFQs</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    s.urgency === 'HIGH' ? 'bg-red-400/20 text-red-400' : s.urgency === 'MEDIUM' ? 'bg-amber-400/20 text-accent-500' : 'bg-surface-secondary text-white/50'
                  }`}>{s.urgency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
