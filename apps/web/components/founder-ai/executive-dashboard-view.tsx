'use client'
import { BarChart3, TrendingUp, MapPin, Building2, Award, Users, DollarSign } from 'lucide-react'
import type { ExecutiveDashboardResponse, FounderAiInsight } from '@/lib/api/ai-founder'

interface Props {
  data: ExecutiveDashboardResponse
  insights: FounderAiInsight[]
  loading?: boolean
}

export function ExecutiveDashboardView({ data, insights, loading }: Props) {
  if (loading) {
    return (
      <div className="surface-card p-4 space-y-3">
        <div className="h-5 w-40 bg-surface-tertiary rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const topRevenue = data.revenueTrend.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="surface-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-semibold text-text-primary">Executive Dashboard</span>
        <span className="text-[11px] text-text-tertiary ml-auto">30-day view</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-surface p-3">
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary"><TrendingUp className="h-3 w-3" /> Revenue</div>
          <div className="text-lg font-bold text-text-primary">Ã¢â€šÂ¹{topRevenue.toLocaleString()}</div>
          <span className={`text-[11px] ${data.growth.revenue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.growth.revenue >= 0 ? '+' : ''}{data.growth.revenue.toFixed(1)}% MoM</span>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary"><DollarSign className="h-3 w-3" /> Cash Flow</div>
          <div className="text-lg font-bold text-text-primary">Ã¢â€šÂ¹{data.cashFlow.net.toLocaleString()}</div>
          <span className="text-[11px] text-text-tertiary">Inflow: Ã¢â€šÂ¹{data.cashFlow.inflow.toLocaleString()}</span>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary"><Users className="h-3 w-3" /> Total Users</div>
          <div className="text-lg font-bold text-purple-400">{data.growth.users.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary"><Award className="h-3 w-3" /> Top Seller</div>
          <div className="text-base font-bold text-text-primary truncate">{data.topSellers[0]?.companyName ?? 'N/A'}</div>
          <span className="text-[11px] text-text-tertiary">Trust Score: {data.topSellers[0]?.trustScore ?? 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-text-tertiary uppercase">Revenue Trend (30d)</div>
          <div className="flex items-end gap-1 h-16">
            {data.revenueTrend.slice(-14).map((r, i) => {
              const max = Math.max(...data.revenueTrend.map(x => x.amount), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t bg-blue-500/40" style={{ height: `${(r.amount / max) * 100}%` }} />
                  <span className="text-[8px] text-text-tertiary">{new Date(r.date).getDate()}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-medium text-text-tertiary uppercase">Top Categories</div>
          <div className="space-y-1">
            {data.topCategories.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text-primary">{c.name}</span>
                <span className="text-text-tertiary">{c.orderCount} orders / Ã¢â€šÂ¹{c.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-[11px] font-medium text-text-tertiary mb-1">Top Cities</div>
          {data.topCities.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <MapPin className="h-3 w-3 text-gray-400" />
              {c.name} ({c.count})
            </div>
          ))}
        </div>
        <div>
          <div className="text-[11px] font-medium text-text-tertiary mb-1">Top Industries</div>
          {data.topIndustries.map((ind, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Building2 className="h-3 w-3 text-gray-400" />
              {ind.name} ({ind.count})
            </div>
          ))}
        </div>
        <div>
          <div className="text-[11px] font-medium text-text-tertiary mb-1">Top Buyers</div>
          {data.topBuyers.map((b, i) => (
            <div key={i} className="text-xs text-text-secondary">
              {b.companyName} Ã¢â‚¬â€ Ã¢â€šÂ¹{b.totalSpent.toLocaleString()} ({b.orderCount} orders)
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
