'use client';

import { DashboardPageHeader, StatCard, DashboardSkeleton } from '@/components/dashboard';
import { useAnalytics } from '@/hooks';
import { Users, Building2, ShoppingCart, IndianRupee, TrendingUp, Activity, AlertCircle } from 'lucide-react';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function AdminAnalyticsPage() {
  const { data, isLoading, error } = useAnalytics();

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Platform Analytics" description="Overall platform metrics" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load analytics</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Platform Analytics" description="Overall platform metrics" />
        <DashboardSkeleton />
      </div>
    );
  }

  const {
    gmv = 0,
    orders = 0,
    totalSellers = 0,
    rfqs = 0,
    payments = 0,
    growth,
  } = data ?? {};
  const growthRate = growth?.growthRate ?? 0;
  const aov = orders > 0 ? Math.round(gmv / orders) : 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Platform Analytics"
        description="Overall platform metrics"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total RFQs" value={String(rfqs)} change="All time" changeType="neutral" />
        <StatCard icon={Building2} label="Total Orders" value={String(orders)} change="All time" changeType="neutral" />
        <StatCard icon={ShoppingCart} label="Total Sellers" value={String(totalSellers)} change="Listed" changeType="neutral" />
        <StatCard icon={IndianRupee} label="GMV" value={formatINR(gmv)} change={growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`} changeType={growthRate >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Monthly Trades</h2>
              <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Number of completed trades per month</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
              const heights = [40, 55, 45, 70, 60, 85];
              return (
                <div key={month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-primary-200 dark:bg-primary-900/40"
                    style={{ height: `${heights[i]}px` }}
                  />
                  <span className="text-xs text-text-tertiary">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Revenue Trend</h2>
              <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Platform revenue over time</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
              const heights = [50, 45, 60, 55, 75, 90];
              return (
                <div key={month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-accent-200 dark:bg-accent-900/40"
                    style={{ height: `${heights[i]}px` }}
                  />
                  <span className="text-xs text-text-tertiary">{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Average Order Value</h3>
          <p className="mt-4 text-3xl font-bold text-text-primary dark:text-dark-text-primary">{formatINR(aov)}</p>
          <div className="mt-4 flex items-center gap-1 text-sm text-accent-600 dark:text-accent-400">
            <TrendingUp className="h-4 w-4" />
            <span>Per order</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
            <div className="h-2 w-3/4 rounded-full bg-primary-500" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Total Orders</h3>
          <p className="mt-4 text-3xl font-bold text-text-primary dark:text-dark-text-primary">{orders}</p>
          <div className="mt-4 flex items-center gap-1 text-sm text-accent-600 dark:text-accent-400">
            <TrendingUp className="h-4 w-4" />
            <span>All time</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
            <div className="h-2 w-2/3 rounded-full bg-accent-500" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Growth Rate</h3>
          <p className="mt-4 text-3xl font-bold text-text-primary dark:text-dark-text-primary">{growthRate}%</p>
          <div className="mt-4 flex items-center gap-1 text-sm text-accent-600 dark:text-accent-400">
            <TrendingUp className="h-4 w-4" />
            <span>Period growth</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
            <div className="h-2 w-1/4 rounded-full bg-accent-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
