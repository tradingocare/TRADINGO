'use client';

import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceDashboard, useCreditUtilization } from '@/hooks/use-finance';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
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
          {isLoading ? <TableSkeleton rows={12} /> : !dashboard?.monthlySummary?.length ? <EmptyState title="No data" /> : (
            <Table>
              <THead><TR><TH>Month</TH><TH>Revenue</TH><TH>Pending</TH><TH>Refunded</TH><TH>Net</TH><TH>Transactions</TH></TR></THead>
              <TBody>
                {dashboard.monthlySummary.map((m: any) => (
                  <TR key={m.month}>
                    <TD>{m.month}</TD>
                    <TD className="text-green-400">₹{m.revenue.toLocaleString()}</TD>
                    <TD className="text-yellow-400">₹{m.pending.toLocaleString()}</TD>
                    <TD className="text-red-400">₹{m.refunded.toLocaleString()}</TD>
                    <TD className="font-medium">₹{(m.revenue - m.refunded).toLocaleString()}</TD>
                    <TD>{m.transactions}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
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
