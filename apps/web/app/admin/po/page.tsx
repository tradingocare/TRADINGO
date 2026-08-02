'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import {
  useAdminPoOverview, useAdminPos, useAdminFlaggedPos, useAdminPoAudit,
} from '@/hooks/use-smart-po';
import { Table, THead, TR, TH, TBody, TD } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Activity } from 'lucide-react';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'orders', label: 'All POs' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'audit', label: 'Audit' },
];

const fmtStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function AdminPoPage() {
  const [tab, setTab] = useState<string>('overview');
  const { data: overview, isLoading: overviewLoading } = useAdminPoOverview();
  const { data: ordersData, isLoading: ordersLoading } = useAdminPos();
  const { data: flaggedData, isLoading: flaggedLoading } = useAdminFlaggedPos();
  const { data: auditData, isLoading: auditLoading } = useAdminPoAudit();

  const ov: any = overview;
  const statusCounts = ov?.byStatus?.reduce((acc: any, s: any) => ({ ...acc, [s.status]: s._count }), {}) || {};

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Purchase Order Monitoring" description="Admin oversight for all purchase orders" />

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="rounded-xl border border-border bg-surface p-1 backdrop-blur-xl" />

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
        <>
          {ordersLoading ? (
            <div className="rounded-xl border border-border bg-surface p-8 backdrop-blur-xl"><TableSkeleton /></div>
          ) : ordersData?.data?.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface backdrop-blur-xl"><div className="p-8"><EmptyState variant="empty" title="No purchase orders found" /></div></div>
          ) : (
            <Table className="min-w-[700px]">
              <THead>
                <TR><TH>PO Number</TH><TH>Buyer</TH><TH>Seller</TH><TH>Status</TH><TH>Amount</TH><TH>Items</TH><TH>Created</TH></TR>
              </THead>
              <TBody>
                {ordersData?.data?.map((po: any) => (
                  <TR key={po.id}>
                    <TD className="font-bold text-orange-400">{po.poNumber}</TD>
                    <TD className="text-white">{po.buyerCompany?.name || '-'}</TD>
                    <TD className="text-white">{po.sellerCompany?.name || '-'}</TD>
                    <TD><StatusBadge status={fmtStatus(po.status)} /></TD>
                    <TD className="text-white/80">{po.currency || 'INR'} {(po.totalAmount || 0).toLocaleString('en-IN')}</TD>
                    <TD className="text-white/60">{po._count?.lineItems || 0}</TD>
                    <TD className="text-white/60">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN') : '-'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}

      {tab === 'flagged' && (
        <>
          {flaggedLoading ? (
            <div className="rounded-xl border border-border bg-surface p-8 backdrop-blur-xl"><TableSkeleton /></div>
          ) : flaggedData?.data?.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface backdrop-blur-xl"><div className="p-8"><EmptyState variant="empty" title="No flagged POs" /></div></div>
          ) : (
            <Table className="min-w-[600px]">
              <THead>
                <TR><TH>PO</TH><TH>Buyer</TH><TH>Seller</TH><TH>Status</TH><TH>Updated</TH></TR>
              </THead>
              <TBody>
                {flaggedData?.data?.map((po: any) => (
                  <TR key={po.id}>
                    <TD className="font-bold text-orange-400">{po.poNumber}</TD>
                    <TD className="text-white">{po.buyerCompany?.name || '-'}</TD>
                    <TD className="text-white">{po.sellerCompany?.name || '-'}</TD>
                    <TD><StatusBadge status={fmtStatus(po.status)} /></TD>
                    <TD className="text-white/60">{po.updatedAt ? new Date(po.updatedAt).toLocaleDateString('en-IN') : '-'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}

      {tab === 'audit' && (
        <>
          {auditLoading ? (
            <div className="rounded-xl border border-border bg-surface p-8 backdrop-blur-xl"><TableSkeleton /></div>
          ) : auditData?.data?.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface backdrop-blur-xl"><div className="p-8"><EmptyState variant="empty" title="No audit events" /></div></div>
          ) : (
            <Table className="min-w-[600px]">
              <THead>
                <TR><TH>Event</TH><TH>PO</TH><TH>Actor</TH><TH>Date</TH></TR>
              </THead>
              <TBody>
                {auditData?.data?.map((e: any) => (
                  <TR key={e.id}>
                    <TD className="text-white capitalize">{e.eventType?.replace(/_/g, ' ').toLowerCase()}</TD>
                    <TD className="text-white/60">{e.purchaseOrder?.poNumber || '-'}</TD>
                    <TD className="text-white/60">{e.actorRole || '-'}</TD>
                    <TD className="text-white/60">{e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : '-'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
