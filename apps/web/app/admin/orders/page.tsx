'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useOrders } from '@/hooks';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import type { Order } from '@/lib/api/types';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function AdminOrdersPage() {
  const { data, isLoading, error } = useOrders();
  const orders = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Order Management" description="Monitor all orders across the platform" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load orders</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Order Management" description="Monitor all orders across the platform" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Order Management"
        description="Monitor all orders across the platform"
      />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <ShoppingCart className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No orders found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Orders from across the platform will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-2">Order ID</div>
            <div className="col-span-2">Product</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Payment</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
          </div>
          {orders.map((order: Order) => (
            <div
              key={order.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
            >
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <p className="text-sm font-mono font-medium text-text-primary dark:text-dark-text-primary">{order.orderNumber}</p>
              </div>
              <p className="text-sm text-text-primary dark:text-dark-text-primary sm:col-span-2">{order.productName}</p>
              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary sm:col-span-2">{formatINR(order.amount)}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={order.paymentStatus} />
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
