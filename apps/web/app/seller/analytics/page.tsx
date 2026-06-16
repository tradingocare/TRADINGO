'use client';

import { DashboardPageHeader, StatCard, DashboardSkeleton, StatCardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAnalytics } from '@/hooks';
import { TrendingUp, DollarSign, ShoppingCart, BarChart3, PieChart, Package, FileText } from 'lucide-react';

export default function SellerAnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Analytics" description="Your business performance metrics" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Analytics" description="Your business performance metrics" />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load analytics. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { icon: DollarSign, label: 'Total Revenue', value: `₹${analytics.totalRevenue.toLocaleString('en-IN')}`, change: `${analytics.growthRate}%`, changeType: 'positive' as const },
    { icon: ShoppingCart, label: 'Total Orders', value: String(analytics.totalOrders), change: 'All time', changeType: 'neutral' as const },
    { icon: TrendingUp, label: 'Growth Rate', value: `${analytics.growthRate}%`, change: 'Period growth', changeType: analytics.growthRate >= 0 ? 'positive' as const : 'negative' as const },
    { icon: Package, label: 'Products', value: String(analytics.totalProducts), change: 'Total listed', changeType: 'neutral' as const },
    { icon: FileText, label: 'RFQs', value: String(analytics.totalRfqs), change: 'Total received', changeType: 'neutral' as const },
    { icon: DollarSign, label: 'Avg Order Value', value: `₹${analytics.averageOrderValue.toLocaleString('en-IN')}`, change: 'Per order', changeType: 'neutral' as const },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Analytics"
        description="Your business performance metrics"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} change={stat.change} changeType={stat.changeType} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue trends for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-secondary/50 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <div className="text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Distribution</CardTitle>
            <CardDescription>Breakdown by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-secondary/50 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <div className="text-center">
                <PieChart className="mx-auto h-10 w-10 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
