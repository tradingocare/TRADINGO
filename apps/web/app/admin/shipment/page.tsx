'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useAdminShipmentAnalytics, useAdminShipments } from '@/hooks/use-smart-shipment';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import { Package, AlertCircle, Truck, TrendingUp, XCircle, Clock, CheckCircle, MapPin } from 'lucide-react';
import Link from 'next/link';

const statusTabs = ['ALL', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP', 'COURIER_ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED'];

const statusColor: Record<string, string> = {
  PREPARING: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  PACKED: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
  READY_FOR_PICKUP: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  COURIER_ASSIGNED: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  DISPATCHED: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  IN_TRANSIT: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  OUT_FOR_DELIVERY: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  DELIVERED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  DELIVERY_FAILED: 'border-red-500/40 bg-red-500/10 text-red-400',
  RETURNED: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
};

export default function AdminShipmentDashboard() {
  const [tab, setTab] = useState<'overview' | 'all' | 'delayed'>('overview');
  const [status, setStatus] = useState('ALL');
  const { data: analytics, isLoading: analyticsLoading } = useAdminShipmentAnalytics();
  const { data: shipmentsData, isLoading: shipmentsLoading } = useAdminShipments(status === 'ALL' ? undefined : status);
  const shipments = shipmentsData?.data ?? [];

  const statusCounts = analytics?.byStatus?.reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = s._count.id;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Shipment Management"
        description="Monitor and manage all shipments across the platform"
      />

      <Tabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'all', label: 'All' }, { value: 'delayed', label: 'Delayed' }]} value={tab} onChange={(v) => setTab(v as 'overview' | 'all' | 'delayed')} className="surface-card p-1" />

      {tab === 'overview' && (
        <>
          {analyticsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Package} label="Total Shipments" value={String(analytics?.totalShipments ?? 0)} />
              <StatCard icon={Clock} label="Preparing" value={String(statusCounts['PREPARING'] ?? 0)} />
              <StatCard icon={Truck} label="In Transit" value={String((statusCounts['DISPATCHED'] ?? 0) + (statusCounts['IN_TRANSIT'] ?? 0) + (statusCounts['OUT_FOR_DELIVERY'] ?? 0))} />
              <StatCard icon={CheckCircle} label="Delivered" value={String(statusCounts['DELIVERED'] ?? 0)} changeType="positive" />
              <StatCard icon={XCircle} label="Failed" value={String(statusCounts['DELIVERY_FAILED'] ?? 0)} />
            </div>
          )}

          <div className="surface-card p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Status Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusColor).map(([s, cls]) => (
                <div key={s} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${cls}`}>
                  {s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}: {statusCounts[s] ?? 0}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Recent Shipments</h3>
            {analyticsLoading ? <TableSkeleton rows={5} /> : (
              <div className="space-y-3">
                {analytics?.recentShipments?.slice(0, 10).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={s.status} />
                      <p className="font-mono text-sm text-white">{s.shipmentNumber}</p>
                      <p className="text-xs text-white/50">{s.order?.orderNumber ?? ''}</p>
                    </div>
                    <p className="text-xs text-white/50">{new Date(s.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'all' && (
        <>
          <div className="surface-card p-1">
            <Tabs tabs={statusTabs.map(s => ({ value: s, label: s === 'ALL' ? 'All' : s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') }))} value={status} onChange={setStatus as (v: string) => void} />
          </div>

          {shipmentsLoading ? <TableSkeleton rows={8} /> : shipments.length === 0 ? (
            <div className="surface-card p-12 backdrop-blur-xl">
              <EmptyState icon={Package} title="No shipments found" />
            </div>
          ) : (
            <div className="glass-card">
              <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-white/50 sm:grid">
                <div className="col-span-2">Shipment</div>
                <div className="col-span-2">Order</div>
                <div className="col-span-2">Buyer</div>
                <div className="col-span-2">Seller</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Date</div>
              </div>
              {shipments.map((s: any) => (
                <div key={s.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center">
                  <p className="font-mono text-sm text-white sm:col-span-2">{s.shipmentNumber}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{s.order?.orderNumber ?? '—'}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{s.buyerCompany?.name ?? '—'}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{s.sellerCompany?.name ?? '—'}</p>
                  <div className="sm:col-span-2"><StatusBadge status={s.status} /></div>
                  <p className="text-xs text-white/50 sm:col-span-2">{new Date(s.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'delayed' && (
        <>
          {analyticsLoading ? <TableSkeleton rows={5} /> : (
            <div className="space-y-3">
              {analytics?.delayedShipments?.length ? analytics.delayedShipments.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="font-mono text-sm text-white">{s.shipmentNumber}</p>
                      <p className="text-xs text-white/50">Status: {s.status}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/50">{new Date(s.updatedAt).toLocaleDateString('en-IN')}</p>
                </div>
              )) : (
                <div className="surface-card p-12 backdrop-blur-xl">
                  <EmptyState icon={CheckCircle} title="No delayed shipments" description="All shipments are on track." />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
