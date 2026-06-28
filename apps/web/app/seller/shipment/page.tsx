'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSellerShipments } from '@/hooks/use-smart-shipment';
import { Package, AlertCircle, Search, RefreshCw, Eye, Truck, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

const statusTabs = ['ALL', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP', 'COURIER_ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED'];

export default function SellerShipmentDashboard() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useSellerShipments(status === 'ALL' ? undefined : status);
  const shipments = data?.data ?? [];

  const preparing = shipments.filter((s: any) => s.status === 'PREPARING');
  const inTransit = shipments.filter((s: any) => ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status));
  const delivered = shipments.filter((s: any) => s.status === 'DELIVERED');

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Shipments"
        description="Manage outgoing shipments"
        actions={
          <Link href="/seller/shipment/new">
            <Button variant="accent"><Plus className="mr-2 h-4 w-4" />Create Shipment</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Shipments" value={String(shipments.length)} />
        <StatCard icon={Clock} label="Preparing" value={String(preparing.length)} />
        <StatCard icon={Truck} label="In Transit" value={String(inTransit.length)} />
        <StatCard icon={Package} label="Delivered" value={String(delivered.length)} changeType="positive" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input placeholder="Search shipments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
          <p className="mt-4 text-lg font-medium text-white">Failed to load shipments</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} />
      ) : shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <Truck className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No shipments found</p>
          <p className="mt-1 text-sm text-white/60">Create a shipment from a confirmed order to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/50 sm:grid">
            <div className="col-span-2">Shipment</div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Buyer</div>
            <div className="col-span-1">Courier</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1" />
          </div>
          {shipments.map((s: any) => (
            <div key={s.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center">
              <p className="font-mono text-sm font-medium text-white sm:col-span-2">{s.shipmentNumber}</p>
              <p className="text-sm text-white/70 sm:col-span-2">{s.order?.orderNumber ?? '—'}</p>
              <p className="text-sm text-white/70 sm:col-span-2">{s.order?.buyerCompany?.name ?? '—'}</p>
              <p className="text-sm text-white/70 sm:col-span-1">{s.courierProvider?.name ?? '—'}</p>
              <div className="sm:col-span-2"><StatusBadge status={s.status} /></div>
              <p className="text-xs text-white/50 sm:col-span-2">{new Date(s.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="sm:col-span-1 text-right">
                <Link href={`/seller/shipment/${s.id}`}>
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
