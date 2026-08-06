'use client'
import { BarChart3, TrendingUp, TrendingDown, Globe, Package, Award } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecutiveDashboardResponse } from '@/lib/api/ai-founder'

interface ExecutiveDashboardProps {
  data?: ExecutiveDashboardResponse
  isLoading: boolean
  error?: Error | null
}

export function ExecutiveDashboard({ data, isLoading, error }: ExecutiveDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary">
        <LoadingSpinner size="sm" color="accent" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        Failed to load executive dashboard
      </div>
    )
  }

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <BarChart3 className="h-4 w-4 text-blue-400" />
          30-Day Executive Dashboard
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[11px] text-text-tertiary mb-1">Revenue (30d)</div>
          <div className="text-lg font-bold text-text-primary">â‚¹{(data.revenueTrend.reduce((s, r) => s + r.amount, 0)).toLocaleString()}</div>
          <div className={`flex items-center gap-0.5 text-[11px] mt-0.5 ${data.growth.revenue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.growth.revenue >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {data.growth.revenue.toFixed(1)}% MoM
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[11px] text-text-tertiary mb-1">Cash Flow (Net)</div>
          <div className="text-lg font-bold text-text-primary">â‚¹{data.cashFlow.net.toLocaleString()}</div>
          <div className="text-[11px] text-text-tertiary mt-0.5">Inflow: â‚¹{data.cashFlow.inflow.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[11px] text-text-tertiary mb-1">Orders (30d)</div>
          <div className="text-lg font-bold text-text-primary">{data.growth.orders.toFixed(0)}</div>
          <div className={`flex items-center gap-0.5 text-[11px] mt-0.5 ${data.growth.orders >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.growth.orders >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {data.growth.orders.toFixed(1)}% MoM
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[11px] text-text-tertiary mb-1">Total Users</div>
          <div className="text-lg font-bold text-text-primary">{data.growth.users.toLocaleString()}</div>
          <div className="text-[11px] text-text-tertiary mt-0.5">{data.growth.rfqs.toLocaleString()} RFQs all-time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <Globe className="h-3 w-3" />
            Geographic Distribution
          </div>
          <div className="space-y-1">
            {data.topCities.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{c.name}</span>
                <span className="text-text-tertiary">{c.count} companies</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <Package className="h-3 w-3" />
            Top Categories
          </div>
          <div className="space-y-1">
            {data.topCategories.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{c.name}</span>
                <span className="text-text-tertiary">{c.orderCount} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <Award className="h-3 w-3" />
            Top Buyers
          </div>
          <div className="space-y-1">
            {data.topBuyers.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{b.companyName}</span>
                <span className="text-text-tertiary">{b.orderCount} orders Â· â‚¹{b.totalSpent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <Award className="h-3 w-3" />
            Top Sellers
          </div>
          <div className="space-y-1">
            {data.topSellers.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{s.companyName}</span>
                <span className="text-text-tertiary">{s.orderCount} orders Â· Trust: {s.trustScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
        <div className="flex items-center gap-2 text-xs text-indigo-300">
          <BarChart3 className="h-3 w-3" />
          TradeServ: {data.tradeServ.status === 'coming_soon' ? 'Coming Soon' : 'Active'}
        </div>
        <p className="text-[11px] text-text-tertiary mt-1">{data.tradeServ.message}</p>
      </div>
    </Card>
  )
}
