'use client'
import { ShoppingCart, Package, ArrowRightLeft, FileText, BarChart3 } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MarketplaceIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props { data?: MarketplaceIntelligenceResponse; isLoading: boolean; error?: Error | null }

export function MarketplaceIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load marketplace intelligence</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <ShoppingCart className="h-4 w-4 text-blue-400" />
          Marketplace Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-[11px] font-medium text-text-secondary flex items-center gap-1"><FileText className="h-3 w-3" />Demand</p>
          <p className="text-lg font-bold text-text-primary mt-1">{data.demand.activeRfqs}</p>
          <p className="text-[10px] text-text-tertiary">active RFQs</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-[11px] font-medium text-text-secondary flex items-center gap-1"><Package className="h-3 w-3" />Supply</p>
          <p className="text-lg font-bold text-text-primary mt-1">{data.supply.activeProducts}</p>
          <p className="text-[10px] text-text-tertiary">active products</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-[11px] font-medium text-text-secondary flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" />Conversion</p>
          <p className="text-lg font-bold text-text-primary mt-1">{data.conversion.rfqToQuoteRate}%</p>
          <p className="text-[10px] text-text-tertiary">RFQ→Quote rate</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1 flex items-center gap-1"><BarChart3 className="h-3 w-3" />RFQ by Category</p>
          {data.rfqs.byCategory.slice(0, 3).map((c, i) => (
            <div key={i} className="flex justify-between text-[11px]"><span className="text-text-secondary">{c.name}</span><span className="text-text-primary">{c.count}</span></div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1 flex items-center gap-1"><BarChart3 className="h-3 w-3" />Orders</p>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">This month</span><span className="text-text-primary">{data.orders.thisMonth}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Avg value</span><span className="text-text-primary">₹{data.orders.avgValue.toLocaleString()}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Total</span><span className="text-text-primary">{data.orders.total}</span></div>
        </div>
      </div>
    </Card>
  )
}
