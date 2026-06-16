'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useOrders } from '@/hooks';
import { ShoppingCart, User, Calendar } from 'lucide-react';
import type { Order } from '@/lib/api/types';

export default function SellerOrdersPage() {
  const { data, isLoading, error } = useOrders();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Orders"
        description="Manage your incoming orders"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load orders. Please try again.</p>
        </div>
      ) : !data?.data?.length ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <ShoppingCart className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No orders yet</h3>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Orders from buyers will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-1">Order</div>
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Buyer</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1" />
          </div>
          {data.data.map((order: Order) => (
            <div key={order.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border">
              <p className="text-xs font-mono font-medium text-primary-600 dark:text-primary-400 sm:col-span-1">{order.orderNumber}</p>
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{order.productName}</p>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <User className="h-3.5 w-3.5 text-text-tertiary" />
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{order.buyerId}</p>
              </div>
              <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary sm:col-span-2">₹{order.amount.toLocaleString('en-IN')}</p>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="sm:col-span-1">
                <StatusBadge status={order.status} />
              </div>
              <div className="sm:col-span-1 sm:text-right">
                <span className="text-xs font-medium text-primary-600 hover:underline cursor-pointer dark:text-primary-400">View</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
