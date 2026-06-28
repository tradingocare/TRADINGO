'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard } from '@/components/dashboard';
import {
  useAdminPoOverview, useAdminPos, useAdminFlaggedPos, useAdminPoAudit,
} from '@/hooks/use-smart-po';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Activity } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'All POs' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'audit', label: 'Audit' },
] as const;

type Tab = typeof TABS[number]['key'];

function StatCardSkeleton() { return <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />; }
function TableSkeleton() { return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>; }

const fmtStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function AdminPoPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const { data: overview, isLoading: overviewLoading } = useAdminPoOverview();
  const { data: ordersData, isLoading: ordersLoading } = useAdminPos();
  const { data: flaggedData, isLoading: flaggedLoading } = useAdminFlaggedPos();
  const { data: auditData, isLoading: auditLoading } = useAdminPoAudit();

  const ov: any = overview;
  const statusCounts = ov?.byStatus?.reduce((acc: any, s: any) => ({ ...acc, [s.status]: s._count }), {}) || {};

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Purchase Order Monitoring" description="Admin oversight for all purchase orders" />

      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.04] p-1 backdrop-blur-xl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={FileText} label="Total POs" value={String(ov?.total || 0)} />
                <StatCard icon={CheckCircle} label="Seller Accepted" value={String(statusCounts['SELLER_ACCEPTED'] || 0)} changeType="positive" />
                <StatCard icon={XCircle} label="Rejected" value={String(statusCounts['REJECTED'] || 0)} changeType="negative" />
                <StatCard icon={AlertTriangle} label="Cancelled" value={String(statusCounts['CANCELLED'] || 0)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard icon={Activity} label="Draft" value={String(statusCounts['DRAFT'] || 0)} />
                <StatCard icon={Clock} label="Locked" value={String(statusCounts['LOCKED'] || 0)} />
                <StatCard icon={Activity} label="Total Events" value={String(ov?.totalEvents || 0)} />
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          {ordersLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead><tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">PO Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Created</th>
                </tr></thead>
                <tbody>
                  {ordersData?.data?.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-white/40">No purchase orders found</td></tr>
                  ) : ordersData?.data?.map((po: any) => (
                    <tr key={po.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm font-bold text-orange-400">{po.poNumber}</td>
                      <td className="px-4 py-3 text-sm text-white">{po.buyerCompany?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white">{po.sellerCompany?.name || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={fmtStatus(po.status)} /></td>
                      <td className="px-4 py-3 text-sm text-white/80">{po.currency || 'INR'} {(po.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{po._count?.lineItems || 0}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'flagged' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          {flaggedLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead><tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">PO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Updated</th>
                </tr></thead>
                <tbody>
                  {flaggedData?.data?.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-white/40">No flagged POs</td></tr>
                  ) : flaggedData?.data?.map((po: any) => (
                    <tr key={po.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm font-bold text-orange-400">{po.poNumber}</td>
                      <td className="px-4 py-3 text-sm text-white">{po.buyerCompany?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white">{po.sellerCompany?.name || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={fmtStatus(po.status)} /></td>
                      <td className="px-4 py-3 text-sm text-white/60">{po.updatedAt ? new Date(po.updatedAt).toLocaleDateString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          {auditLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead><tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">PO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Date</th>
                </tr></thead>
                <tbody>
                  {auditData?.data?.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-white/40">No audit events</td></tr>
                  ) : auditData?.data?.map((e: any) => (
                    <tr key={e.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm text-white capitalize">{e.eventType?.replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{e.purchaseOrder?.poNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{e.actorRole || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
