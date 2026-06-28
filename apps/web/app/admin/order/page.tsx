'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useAdminOrderAnalytics, useAdminOrders } from '@/hooks/use-smart-order';
import { Package, AlertCircle, ShoppingCart, TrendingUp, Eye, XCircle, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const statusTabs = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'];

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const statusColor: Record<string, string> = {
  PENDING: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  CONFIRMED: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  PROCESSING: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  PACKED: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
  READY_FOR_DISPATCH: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  DISPATCHED: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  IN_TRANSIT: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  DELIVERED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  COMPLETED: 'border-green-500/40 bg-green-500/10 text-green-400',
  CANCELLED: 'border-red-500/40 bg-red-500/10 text-red-400',
  RETURNED: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
};

export default function AdminOrderDashboard() {
  const [tab, setTab] = useState<'overview' | 'all' | 'flagged'>('overview');
  const [status, setStatus] = useState('ALL');
  const { data: analytics, isLoading: analyticsLoading } = useAdminOrderAnalytics();
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders(status === 'ALL' ? undefined : status);
  const orders = ordersData?.data ?? [];

  const statusCounts = analytics?.byStatus?.reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = s._count.id;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Order Management"
        description="Monitor and manage all orders across the platform"
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-1">
        {(['overview', 'all', 'flagged'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {analyticsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Package} label="Total Orders" value={String(analytics?.totalOrders ?? 0)} />
              <StatCard icon={Clock} label="Pending" value={String(statusCounts['PENDING'] ?? 0)} />
              <StatCard icon={ShoppingCart} label="Processing" value={String((statusCounts['PROCESSING'] ?? 0) + (statusCounts['CONFIRMED'] ?? 0))} changeType="positive" />
              <StatCard icon={TrendingUp} label="In Transit" value={String((statusCounts['IN_TRANSIT'] ?? 0) + (statusCounts['DISPATCHED'] ?? 0))} />
              <StatCard icon={CheckCircle} label="Delivered" value={String(statusCounts['DELIVERED'] ?? 0)} changeType="positive" />
              <StatCard icon={Eye} label="Completed" value={String(statusCounts['COMPLETED'] ?? 0)} changeType="positive" />
              <StatCard icon={XCircle} label="Cancelled" value={String(statusCounts['CANCELLED'] ?? 0)} />
              <StatCard icon={AlertCircle} label="Returned" value={String(statusCounts['RETURNED'] ?? 0)} />
            </div>
          )}

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Status Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusColor).map(([s, cls]) => (
                <div key={s} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${cls}`}>
                  {s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}: {statusCounts[s] ?? 0}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Recent Orders</h3>
            {ordersLoading ? (
              <TableSkeleton rows={5} />
            ) : (
              <div className="space-y-3">
                {analytics?.recentOrders?.slice(0, 10).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <p className="font-mono text-sm text-white">{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{formatINR(Number(order.totalAmount))}</p>
                      <p className="text-xs text-white/50">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'all' && (
        <>
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-1">
            {statusTabs.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                  status === s ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'
                }`}
              >
                {s === 'ALL' ? 'All' : s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <TableSkeleton rows={8} />
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
              <Package className="h-12 w-12 text-white/30" />
              <p className="mt-4 text-lg font-medium text-white">No orders found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
              <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/50 sm:grid">
                <div className="col-span-2">Order</div>
                <div className="col-span-2">Buyer</div>
                <div className="col-span-2">Seller</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Date</div>
              </div>
              {orders.map((order: any) => (
                <div key={order.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center">
                  <p className="font-mono text-sm text-white sm:col-span-2">{order.orderNumber}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{order.buyerCompany?.name ?? '—'}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{order.sellerCompany?.name ?? '—'}</p>
                  <p className="text-sm font-medium text-white sm:col-span-2">{formatINR(Number(order.totalAmount))}</p>
                  <div className="sm:col-span-2"><StatusBadge status={order.status} /></div>
                  <p className="text-xs text-white/50 sm:col-span-2">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'flagged' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No flagged orders</p>
          <p className="mt-1 text-sm text-white/60">Flagged orders (disputed, delayed, or anomalous) will appear here.</p>
        </div>
      )}
    </div>
  );
}
