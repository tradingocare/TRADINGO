'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { useGrowthKpis, useRetentionAnalysis, useLtvAnalysis, useCacAnalysis, useChannelAttribution, useFunnelAnalytics } from '@/hooks/use-growth-intelligence';
import { TrendingUp, Users, DollarSign, ShoppingCart, BarChart3, Activity, PieChart } from 'lucide-react';

export default function AdminGrowthPage() {
  const [days, setDays] = useState(30);
  const { data: kpis, isLoading: kpisLoading } = useGrowthKpis(days);
  const { data: funnelRaw } = useFunnelAnalytics(days);
  const funnel = funnelRaw as any;
  const { data: retention } = useRetentionAnalysis();
  const { data: ltv } = useLtvAnalysis();
  const { data: cac } = useCacAnalysis();
  const { data: attribution } = useChannelAttribution(days);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Growth Dashboard"
        description="Business growth KPIs and analytics"
        actions={<div className="flex gap-2">{([7, 30, 90] as const).map(d => (
          <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>{d}d</Button>
        ))}</div>}
      />

      {kpisLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="New Users" value={String(kpis?.newUsers ?? 0)} />
          <StatCard icon={ShoppingCart} label="Orders" value={String(kpis?.totalOrders ?? 0)} />
          <StatCard icon={DollarSign} label="Revenue" value={kpis?.revenue ? `\u20B9${(kpis.revenue / 100000).toFixed(1)}L` : '\u20B90'} />
          <StatCard icon={TrendingUp} label="Avg LTV" value={ltv?.averageLtv ? `\u20B9${Math.round(ltv.averageLtv).toLocaleString()}` : 'N/A'} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Retention</CardTitle></CardHeader>
          <CardContent>
            {retention ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface rounded p-3 text-center"><p className="text-xs text-text-tertiary">D7</p><p className="text-lg font-semibold">{retention.d7Retention}</p></div>
                  <div className="bg-surface rounded p-3 text-center"><p className="text-xs text-text-tertiary">D30</p><p className="text-lg font-semibold">{retention.d30Retention}</p></div>
                  <div className="bg-surface rounded p-3 text-center"><p className="text-xs text-text-tertiary">D90</p><p className="text-lg font-semibold">{retention.d90Retention}</p></div>
                </div>
                <p className="text-sm text-text-tertiary">Overall: {retention.overallRetentionRate}</p>
              </div>
            ) : <p className="text-text-tertiary text-center py-4">Loading...</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Funnel</CardTitle></CardHeader>
          <CardContent>
            {funnel?.funnelSteps ? (
              <div className="space-y-2">
                {funnel.funnelSteps.map((step: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm"><span>{step.step}</span><span className="text-text-secondary">{step.count} <span className="text-text-tertiary ml-1">({step.dropOffRate})</span></span></div>
                ))}
              </div>
            ) : <p className="text-text-tertiary text-center py-4">No data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-4 w-4" /> CAC</CardTitle></CardHeader>
          <CardContent>
            {cac ? (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-text-tertiary">Total Customers</span><span>{cac.totalCustomers}</span></div>
                <div className="flex justify-between"><span className="text-text-tertiary">Avg CAC</span><span>\u20B9{Math.round(cac.averageCac).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-tertiary">LTV/CAC Ratio</span><span>{cac.ltvCacRatio.toFixed(2)}x</span></div>
              </div>
            ) : <p className="text-text-tertiary text-center py-4">Loading...</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Channel Attribution ({days}d)</CardTitle></CardHeader>
          <CardContent>
            {attribution?.firstTouch?.channels?.length ? (
              <div className="space-y-4">
                {(['firstTouch', 'lastTouch', 'linear'] as const).map((model) => (
                  <div key={model}>
                    <h4 className="text-sm font-medium mb-2 capitalize">{model.replace(/([A-Z])/g, ' $1')}</h4>
                    <div className="space-y-1">
                      {attribution[model]?.channels?.map((ch: any) => (
                        <div key={ch.channel} className="flex justify-between text-sm"><span>{ch.channel}</span><span className="text-text-secondary">\u20B9{ch.attributedRevenue.toLocaleString()} ({ch.percentage})</span></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-text-tertiary text-center py-4">No attribution data for this period</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>LTV by Plan</CardTitle></CardHeader>
          <CardContent>
            {ltv?.byPlan?.length ? (
              <Table><THead><TR><TH>Plan</TH><TH>Avg LTV</TH><TH>Customers</TH></TR></THead>
                <TBody>{ltv.byPlan.map((p: any) => (
                  <TR key={p.plan}><TD>{p.plan}</TD><TD>\u20B9{Math.round(p.averageLtv).toLocaleString()}</TD><TD>{p.customerCount}</TD></TR>
                ))}</TBody>
              </Table>
            ) : <p className="text-text-tertiary text-center py-4">No plan data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
