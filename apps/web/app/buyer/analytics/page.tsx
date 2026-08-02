'use client';

import { DashboardPageHeader } from '@/components/dashboard';
import { useBuyerAnalyticsOverview, useBuyerAnalyticsSpending, useBuyerAnalyticsTopProducts } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Heart, Store, ClipboardList, FileText, ShoppingCart, TrendingUp, Package, AlertCircle } from 'lucide-react';

export default function BuyerAnalyticsPage() {
  const { data: overview, isLoading: ovLoading, isError: ovError } = useBuyerAnalyticsOverview();
  const { data: spending, isLoading: spLoading, isError: spError } = useBuyerAnalyticsSpending();
  const { data: categories, isLoading: catLoading, isError: catError } = useBuyerAnalyticsTopProducts();

  if (ovLoading || spLoading || catLoading) {
    return (
      <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
    );
  }

  if (ovError || spError || catError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">Failed to load analytics</h3>
        <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Something went wrong. Please try again.</p>
        <Button variant="accent" className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const statCards = [
    { icon: Heart, label: 'Saved Products', value: String(overview?.savedProducts ?? 0), color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
    { icon: Store, label: 'Saved Suppliers', value: String(overview?.savedSuppliers ?? 0), color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { icon: ClipboardList, label: 'Requirement Lists', value: String(overview?.requirementLists ?? 0), color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { icon: FileText, label: 'RFQs Created', value: String(overview?.rfqs ?? 0), color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
    { icon: ShoppingCart, label: 'Orders Placed', value: String(overview?.orders ?? 0), color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Analytics" description="Track your procurement activity" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{card.value}</p>
                    <p className="text-xs text-text-secondary">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-[#f97316]" /> Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {(!spending || spending.length === 0) ? (
              <p className="text-sm text-text-secondary py-8 text-center">No spending data yet</p>
            ) : (
              <div className="space-y-2">
                {spending.map((s: any) => (
                  <div key={s.month} className="flex items-center justify-between rounded-lg bg-surface-secondary/50 px-4 py-2.5 text-sm dark:bg-dark-surface-secondary/50">
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{s.month}</span>
                    <span className="text-text-secondary">₹{Number(s.total).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4 text-[#f97316]" /> Top Purchased Products</CardTitle>
          </CardHeader>
          <CardContent>
            {(!categories || categories.length === 0) ? (
              <p className="text-sm text-text-secondary py-8 text-center">No purchase data yet</p>
            ) : (
              <div className="space-y-2">
                {categories.map((c: any) => (
                  <div key={c.productName} className="flex items-center justify-between rounded-lg bg-surface-secondary/50 px-4 py-2.5 text-sm dark:bg-dark-surface-secondary/50">
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{c.productName}</span>
                    <span className="text-text-secondary">{c.count} units</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
