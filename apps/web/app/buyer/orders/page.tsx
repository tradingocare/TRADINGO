'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useOrders } from '@/hooks';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import type { Order } from '@/lib/api/types';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerOrdersPage() {
  const { data, isLoading, error } = useOrders();
  const orders = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="My Orders" description="Track your purchases" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
          <AlertCircle className="h-12 w-12 text-status-error" />
          <p className="mt-4 text-lg font-medium text-text-primary">Failed to load orders</p>
          <p className="mt-1 text-sm text-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="My Orders" description="Track your purchases" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Orders"
        description="Track your purchases"
      />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
          <ShoppingCart className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary">No orders found</p>
          <p className="mt-1 text-sm text-text-secondary">Your orders will appear here once you accept a quote and start a purchase.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary sm:grid">
            <div className="col-span-2">Order ID</div>
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1" />
          </div>
          {orders.map((order: Order) => (
            <div
              key={order.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center"
            >
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <p className="text-sm font-mono font-medium text-text-primary">{order.orderNumber}</p>
              </div>
              <p className="text-sm text-text-primary sm:col-span-3">{order.productName}</p>
              <p className="text-sm font-medium text-text-primary sm:col-span-2">{formatINR(order.amount)}</p>
              <p className="text-sm text-text-secondary sm:col-span-2">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
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
