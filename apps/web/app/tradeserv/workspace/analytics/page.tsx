'use client';

import { Eye, BarChart3, User, Star, TrendingUp, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { DashboardPageHeader, StatCard } from '@/components/dashboard';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { useAnalytics } from '@/hooks/use-tradeserv';

export default function AnalyticsPage() {
  const { data: analytics, isLoading, isError } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-text-secondary">Failed to load analytics data</p>
      </div>
    );
  }

  const { overview, monthlyTrends } = analytics;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Analytics"
        description="Track your profile performance and engagement"
      />
      <div className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Overview</h3>
        <div className="grid gap-6 sm:grid-cols-4">
          <StatCard icon={Star} label="Reviews" value={overview.reviews.toString()} />
          <StatCard icon={User} label="Inquiries" value={overview.inquiries.toString()} />
          <StatCard icon={Eye} label="Bookings" value={overview.bookings.toString()} />
          <StatCard icon={BarChart3} label="TradTrust Score" value={overview.trustScore.toString()} />
        </div>
      </div>
      {monthlyTrends && monthlyTrends.length > 0 && (
        <div className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Calendar className="h-4 w-4 text-[#f59e0b]" />
            Monthly Trends
          </h3>
          <Table>
            <THead><TR><TH>Month</TH><TH>Bookings</TH></TR></THead>
            <TBody>
              {monthlyTrends.map((row) => (
                <TR key={row.month}>
                  <TD className="font-medium text-text-primary">{row.month}</TD>
                  <TD className="text-text-secondary">{row.bookings}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
