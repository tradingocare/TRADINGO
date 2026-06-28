'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSellerDeliveries } from '@/hooks/use-smart-delivery';
import { Package, AlertCircle, Search, RefreshCw, Eye, Truck, CheckCircle, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

const statusTabs = ['ALL', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_CONFIRMED', 'DELIVERY_FAILED', 'REJECTED', 'COMPLETED'];

export default function SellerDeliveryDashboard() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useSellerDeliveries(status === 'ALL' ? undefined : status);
  const deliveries = data?.data ?? [];

  const pendingConfirm = deliveries.filter((d: any) => d.status === 'DELIVERED');
  const confirmed = deliveries.filter((d: any) => d.status === 'DELIVERY_CONFIRMED');
  const failed = deliveries.filter((d: any) => ['DELIVERY_FAILED', 'REJECTED'].includes(d.status));

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Delivery Management" description="Manage outgoing deliveries" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total" value={String(deliveries.length)} />
        <StatCard icon={Clock} label="Pending Confirm" value={String(pendingConfirm.length)} />
        <StatCard icon={CheckCircle} label="Confirmed" value={String(confirmed.length)} changeType="positive" />
        <StatCard icon={AlertCircle} label="Issues" value={String(failed.length)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input placeholder="Search deliveries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-1">
          {statusTabs.map((tab) => (
            <button key={tab} onClick={() => setStatus(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${status === tab ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'}`}>
              {tab === 'ALL' ? 'All' : tab.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12"><AlertCircle className="h-12 w-12 text-red-500" /><p className="mt-4 text-lg font-medium text-white">Failed to load deliveries</p></div>
      ) : isLoading ? (
        <TableSkeleton rows={5} />
      ) : deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12">
          <Truck className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No deliveries yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/50 sm:grid">
            <div className="col-span-2">Delivery</div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Buyer</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2" />
          </div>
          {deliveries.map((d: any) => (
            <div key={d.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center">
              <p className="font-mono text-sm font-medium text-white sm:col-span-2">{d.deliveryNumber}</p>
              <p className="text-sm text-white/70 sm:col-span-2">{d.order?.orderNumber ?? '—'}</p>
              <p className="text-sm text-white/70 sm:col-span-2">{d.buyerCompany?.name ?? '—'}</p>
              <div className="sm:col-span-2"><StatusBadge status={d.status} /></div>
              <p className="text-xs text-white/50 sm:col-span-2">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="sm:col-span-2 text-right">
                <Link href={`/seller/delivery/${d.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
