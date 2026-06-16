'use client';

import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatusBadge, DashboardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useProducts, useRfqs, useOrders, useGocashBalance, useNotifications } from '@/hooks';
import { Package, FileText, ShoppingCart, CreditCard, Plus, MessageSquare } from 'lucide-react';

const quickActions = [
  { label: 'Add New Product', icon: Plus, href: '#', variant: 'default' as const },
  { label: 'View RFQs', icon: FileText, href: '/seller/rfqs', variant: 'outline' as const },
  { label: 'Manage Orders', icon: ShoppingCart, href: '/seller/orders', variant: 'outline' as const },
  { label: 'Messages', icon: MessageSquare, href: '/seller/chat', variant: 'outline' as const },
];

export default function SellerDashboardPage() {
  const { data: products, isLoading: productsLoading } = useProducts({ limit: 1 });
  const { data: rfqs, isLoading: rfqsLoading } = useRfqs({ limit: 1 });
  const { data: orders, isLoading: ordersLoading } = useOrders({ limit: 1 });
  const { data: balance, isLoading: balanceLoading } = useGocashBalance();
  const { data: notifications, isLoading: notifsLoading } = useNotifications({ limit: 5 });

  const isLoading = productsLoading || rfqsLoading || ordersLoading || balanceLoading;

  if (isLoading) return <DashboardSkeleton />;

  const stats = [
    { icon: Package, label: 'Total Products', value: String(products?.total ?? 0), change: `${products?.total ?? 0} listed`, changeType: 'neutral' as const },
    { icon: FileText, label: 'Active RFQs', value: String(rfqs?.total ?? 0), change: `${rfqs?.total ?? 0} open`, changeType: 'neutral' as const },
    { icon: ShoppingCart, label: 'Pending Orders', value: String(orders?.total ?? 0), change: `${orders?.total ?? 0} pending`, changeType: 'neutral' as const },
    { icon: CreditCard, label: 'GOCASH Balance', value: `₹${(balance?.balance ?? 0).toLocaleString('en-IN')}`, change: 'Available', changeType: 'neutral' as const },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Seller Dashboard"
        description="Welcome back! Here's your business overview."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} change={stat.change} changeType={stat.changeType} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Quick Actions</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Common tasks to manage your store</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <Button variant={action.variant} className="w-full">
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Recent Activity</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Latest updates from your store</p>
          <div className="mt-4 space-y-4">
            {notifsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
              ))
            ) : notifications?.data?.length ? (
              notifications.data.map((notif) => (
                <div key={notif.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-secondary/50 p-3 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{notif.title}</p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{notif.message}</p>
                    <p className="mt-0.5 text-xs text-text-tertiary">{new Date(notif.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={notif.read ? 'completed' : 'pending'} />
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
