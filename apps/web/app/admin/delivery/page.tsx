'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useAdminDeliveryAnalytics, useAdminDeliveries } from '@/hooks/use-smart-delivery';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import { Package, AlertCircle, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';

const statusTabs = ['ALL', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_CONFIRMED', 'DELIVERY_FAILED', 'REJECTED', 'COMPLETED'];

const statusColor: Record<string, string> = {
  OUT_FOR_DELIVERY: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  DELIVERED: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  DELIVERY_CONFIRMED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  DELIVERY_FAILED: 'border-red-500/40 bg-red-500/10 text-red-400',
  PARTIALLY_DELIVERED: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  REJECTED: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
  RETURNED: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  COMPLETED: 'border-green-500/40 bg-green-500/10 text-green-400',
};

export default function AdminDeliveryDashboard() {
  const [tab, setTab] = useState<'overview' | 'all' | 'exceptions'>('overview');
  const [status, setStatus] = useState('ALL');
  const { data: analytics, isLoading: analyticsLoading } = useAdminDeliveryAnalytics();
  const { data: deliveriesData, isLoading: deliveriesLoading } = useAdminDeliveries(status === 'ALL' ? undefined : status);
  const deliveries = deliveriesData?.data ?? [];

  const statusCounts = analytics?.byStatus?.reduce((acc: Record<string, number>, s: any) => { acc[s.status] = s._count.id; return acc; }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Delivery Management" description="Monitor all deliveries across the platform" />

      <div className="border border-border rounded-xl p-1 bg-surface">
        <Tabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'all', label: 'All' }, { value: 'exceptions', label: 'Exceptions' }]} value={tab} onChange={setTab as (v: string) => void} />
      </div>

      {tab === 'overview' && (
        <>
          {analyticsLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}</div> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Package} label="Total Deliveries" value={String(analytics?.total ?? 0)} />
              <StatCard icon={Clock} label="Pending Confirm" value={String(analytics?.pendingConfirmation ?? 0)} />
              <StatCard icon={Truck} label="Out For Delivery" value={String(statusCounts['OUT_FOR_DELIVERY'] ?? 0)} />
              <StatCard icon={CheckCircle} label="Completed" value={String(statusCounts['COMPLETED'] ?? 0)} changeType="positive" />
              <StatCard icon={XCircle} label="Failed" value={String(statusCounts['DELIVERY_FAILED'] ?? 0)} />
              <StatCard icon={AlertCircle} label="Rejected" value={String(statusCounts['REJECTED'] ?? 0)} />
            </div>
          )}

          <div className="rounded-xl border border-border p-6 backdrop-blur-xl bg-surface">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Status Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusColor).map(([s, cls]) => (
                <div key={s} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${cls}`}>
                  {s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}: {statusCounts[s] ?? 0}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-6 backdrop-blur-xl bg-surface">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Recent Deliveries</h3>
            {analyticsLoading ? <TableSkeleton rows={5} /> : (
              <div className="space-y-3">
                {analytics?.recent?.slice(0, 10).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-surface">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={d.status} />
                      <p className="font-mono text-sm text-white">{d.deliveryNumber}</p>
                      <p className="text-xs text-white/50">{d.order?.orderNumber ?? ''}</p>
                    </div>
                    <p className="text-xs text-white/50">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'all' && (
        <>
<div className="rounded-xl border border-border p-1 bg-surface">
            <Tabs tabs={statusTabs.map(s => ({ value: s, label: s === 'ALL' ? 'All' : s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') }))} value={status} onChange={setStatus as (v: string) => void} />
          </div>
          {deliveriesLoading ? <TableSkeleton rows={8} /> : deliveries.length === 0 ? (
            <EmptyState icon={Package} title="No deliveries found" />
          ) : (
            <div className="rounded-xl border border-border backdrop-blur-xl bg-surface">
              <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-white/50 sm:grid">
                <div className="col-span-2">Delivery</div>
                <div className="col-span-2">Order</div>
                <div className="col-span-2">Buyer</div>
                <div className="col-span-2">Seller</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Date</div>
              </div>
              {deliveries.map((d: any) => (
                <div key={d.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center">
                  <p className="font-mono text-sm text-white sm:col-span-2">{d.deliveryNumber}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{d.order?.orderNumber ?? '—'}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{d.buyerCompany?.name ?? '—'}</p>
                  <p className="text-sm text-white/70 sm:col-span-2">{d.sellerCompany?.name ?? '—'}</p>
                  <div className="sm:col-span-2"><StatusBadge status={d.status} /></div>
                  <p className="text-xs text-white/50 sm:col-span-2">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'exceptions' && (
        <div className="space-y-3">
          {analytics?.failedDeliveries?.length ? analytics.failedDeliveries.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div><p className="font-mono text-sm text-white">{d.deliveryNumber}</p><p className="text-xs text-white/50">{d.rejectionReason ?? d.status}</p></div>
              </div>
              <p className="text-xs text-white/50">{new Date(d.updatedAt).toLocaleDateString('en-IN')}</p>
            </div>
          )) : (
            <EmptyState icon={CheckCircle} title="No exceptions" description="All deliveries are proceeding normally." />
          )}
        </div>
      )}
    </div>
  );
}
