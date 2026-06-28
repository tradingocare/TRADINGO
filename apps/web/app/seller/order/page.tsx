'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSellerOrders } from '@/hooks/use-smart-order';
import { ShoppingCart, AlertCircle, Search, RefreshCw, Eye, Package, Clock } from 'lucide-react';
import Link from 'next/link';

const statusTabs = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function SellerOrderDashboard() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useSellerOrders(status === 'ALL' ? undefined : status);
  const orders = data?.data ?? [];

  const pendingOrders = orders.filter((o: any) => o.status === 'PENDING');
  const processingOrders = orders.filter((o: any) => ['CONFIRMED', 'PROCESSING'].includes(o.status));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Customer Orders"
        description="Manage incoming orders from buyers"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Orders" value={String(orders.length)} />
        <StatCard icon={Clock} label="Pending" value={String(pendingOrders.length)} />
        <StatCard icon={ShoppingCart} label="Processing" value={String(processingOrders.length)} changeType="positive" />
        <StatCard icon={Eye} label="Delivered" value={String(orders.filter((o: any) => o.status === 'DELIVERED').length)} changeType="positive" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                status === tab ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-white">Failed to load orders</p>
          <p className="mt-1 text-sm text-white/60">{(error as any).message}</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <ShoppingCart className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No orders found</p>
          <p className="mt-1 text-sm text-white/60">Orders from buyers will appear here once generated.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/50 sm:grid">
            <div className="col-span-2">Order</div>
            <div className="col-span-3">Buyer</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1" />
          </div>
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center"
            >
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <p className="text-sm font-mono font-medium text-white">{order.orderNumber}</p>
              </div>
              <p className="text-sm text-white/70 sm:col-span-3">{order.buyerCompany?.name ?? '—'}</p>
              <p className="text-sm font-medium text-white sm:col-span-2">{formatINR(Number(order.totalAmount))}</p>
              <p className="text-sm text-white/50 sm:col-span-2">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={order.status} />
              </div>
              <div className="sm:col-span-1 text-right">
                <Link href={`/seller/order/${order.id}`}>
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
