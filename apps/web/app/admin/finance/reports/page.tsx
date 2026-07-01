'use client';

import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceDashboard, useCreditUtilization } from '@/hooks/use-finance';
import { DollarSign, TrendingUp, Clock, CreditCard, BarChart3 } from 'lucide-react';

export default function AdminFinanceReportsPage() {
  const { data: dashboard, isLoading } = useFinanceDashboard({ months: 24 });
  const { data: utilization } = useCreditUtilization();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Finance Reports" description="Revenue, receivables, and financial performance" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />) : dashboard ? (
          <>
            <StatCard icon={DollarSign} label="Revenue" value={`₹${dashboard.revenue.toLocaleString()}`} />
            <StatCard icon={TrendingUp} label="Collection Rate" value={`${dashboard.collectionRate}%`} />
            <StatCard icon={BarChart3} label="Total Transactions" value={String(dashboard.totalTransactions)} />
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Revenue (Last 24 Months)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton rows={12} /> : !dashboard?.monthlySummary?.length ? <p className="text-sm text-gray-400">No data</p> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-700 text-left text-sm text-gray-400"><th className="p-3">Month</th><th className="p-3">Revenue</th><th className="p-3">Pending</th><th className="p-3">Refunded</th><th className="p-3">Net</th><th className="p-3">Transactions</th></tr></thead>
                <tbody>
                  {dashboard.monthlySummary.map((m: any) => (
                    <tr key={m.month} className="border-b border-gray-700/50">
                      <td className="p-3 text-sm">{m.month}</td>
                      <td className="p-3 text-sm text-green-400">₹{m.revenue.toLocaleString()}</td>
                      <td className="p-3 text-sm text-yellow-400">₹{m.pending.toLocaleString()}</td>
                      <td className="p-3 text-sm text-red-400">₹{m.refunded.toLocaleString()}</td>
                      <td className="p-3 text-sm font-medium">₹{(m.revenue - m.refunded).toLocaleString()}</td>
                      <td className="p-3 text-sm">{m.transactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {utilization && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={CreditCard} label="Total Credit Exposure" value={`₹${utilization.totalLimit.toLocaleString()}`} />
          <StatCard icon={Clock} label="Outstanding Credit" value={`₹${utilization.totalUsed.toLocaleString()}`} />
          <StatCard icon={TrendingUp} label="Utilization Rate" value={`${utilization.utilizationRate}%`} />
        </div>
      )}
    </div>
  );
}
