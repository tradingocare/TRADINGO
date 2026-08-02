'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Table, THead, TR, TH, TBody, TD } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import {
  useAdminNegotiationOverview, useAdminNegotiations, useAdminFlaggedNegotiations, useAdminNegotiationAudit,
} from '@/hooks/use-smart-negotiation';
import {
  MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle, Activity,
} from 'lucide-react';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'negotiations', label: 'All Negotiations' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'audit', label: 'Audit' },
];

const formatStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function AdminNegotiationPage() {
  const [tab, setTab] = useState<string>('overview');

  const { data: overview, isLoading: overviewLoading } = useAdminNegotiationOverview();
  const { data: negotiationsData, isLoading: negotiationsLoading } = useAdminNegotiations();
  const { data: flaggedData, isLoading: flaggedLoading } = useAdminFlaggedNegotiations();
  const { data: auditData, isLoading: auditLoading } = useAdminNegotiationAudit();

  const ov: any = overview;
  const statusCounts = ov?.byStatus?.reduce((acc: any, s: any) => ({ ...acc, [s.status]: s._count }), {}) || {};

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Negotiation Monitoring"
        description="Admin oversight for all active and completed negotiations"
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="rounded-xl border border-border bg-surface p-1 backdrop-blur-xl" />

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={MessageSquare} label="Total Negotiations" value={String(ov?.total || 0)} />
                <StatCard icon={CheckCircle} label="Accepted" value={String(statusCounts['ACCEPTED'] || 0)} changeType="positive" />
                <StatCard icon={XCircle} label="Rejected" value={String(statusCounts['REJECTED'] || 0)} changeType="negative" />
                <StatCard icon={Activity} label="Active" value={String(
                  (statusCounts['NEGOTIATION_STARTED'] || 0) +
                  (statusCounts['BUYER_COUNTER'] || 0) +
                  (statusCounts['SELLER_COUNTER'] || 0) +
                  (statusCounts['PENDING'] || 0)
                )} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard icon={Clock} label="Converted" value={String(statusCounts['CONVERTED'] || 0)} />
                <StatCard icon={AlertTriangle} label="Cancelled" value={String(statusCounts['CANCELLED'] || 0)} />
                <StatCard icon={Activity} label="Total Events" value={String(ov?.totalEvents || 0)} />
              </div>
            </>
          )}
        </div>
      )}

      {/* All Negotiations Tab */}
      {tab === 'negotiations' && (
        <>
          {negotiationsLoading ? (
            <div className="rounded-xl border border-border bg-surface p-8 backdrop-blur-xl"><TableSkeleton /></div>
          ) : negotiationsData?.data?.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface backdrop-blur-xl"><div className="p-8"><EmptyState variant="empty" title="No negotiations found" /></div></div>
          ) : (
            <Table className="min-w-[600px]">
              <THead>
                <TR>
                  <TH>Buyer</TH>
                  <TH>Seller</TH>
                  <TH>Status</TH>
                  <TH>Amount</TH>
                  <TH>Versions</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {negotiationsData?.data?.map((n: any) => (
                  <TR key={n.id}>
                    <TD className="text-white">{n.buyerCompany?.name || '-'}</TD>
                    <TD className="text-white">{n.sellerCompany?.name || '-'}</TD>
                    <TD><StatusBadge status={formatStatus(n.status)} /></TD>
                    <TD className="text-white/80">
                      {n.quote?.currency || 'INR'} {n.quote?.totalAmount?.toLocaleString('en-IN') || '-'}
                    </TD>
                    <TD className="text-white/60">{n._count?.versions || 0}</TD>
                    <TD className="text-white/60">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN') : '-'}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}

      {/* Flagged Tab */}
      {tab === 'flagged' && (
        <>
          {flaggedLoading ? (
            <div className="rounded-xl border border-border bg-surface p-8 backdrop-blur-xl"><TableSkeleton /></div>
          ) : flaggedData?.data?.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface backdrop-blur-xl"><div className="p-8"><EmptyState variant="empty" title="No flagged negotiations" /></div></div>
          ) : (
            <Table className="min-w-[600px]">
              <THead>
                <TR>
                  <TH>Buyer</TH>
                  <TH>Seller</TH>
                  <TH>Status</TH>
                  <TH>RFQ</TH>
                  <TH>Updated</TH>
                </TR>
              </THead>
              <TBody>
                {flaggedData?.data?.map((n: any) => (
                  <TR key={n.id}>
                    <TD className="text-white">{n.buyerCompany?.name || '-'}</TD>
                    <TD className="text-white">{n.sellerCompany?.name || '-'}</TD>
                    <TD><StatusBadge status={formatStatus(n.status)} /></TD>
                    <TD className="text-white/60 truncate max-w-[200px]">{n.rfq?.title || '-'}</TD>
                    <TD className="text-white/60">
                      {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-IN') : '-'}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}

      {/* Audit Tab */}
      {tab === 'audit' && (
        <>
          {auditLoading ? (
            <div className="rounded-xl border border-border bg-surface p-8 backdrop-blur-xl"><TableSkeleton /></div>
          ) : auditData?.data?.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface backdrop-blur-xl"><div className="p-8"><EmptyState variant="empty" title="No audit events" /></div></div>
          ) : (
            <Table className="min-w-[600px]">
              <THead>
                <TR>
                  <TH>Event</TH>
                  <TH>Actor Role</TH>
                  <TH>Date</TH>
                  <TH>Metadata</TH>
                </TR>
              </THead>
              <TBody>
                {auditData?.data?.map((e: any) => (
                  <TR key={e.id}>
                    <TD className="text-white capitalize">
                      {e.eventType?.replace(/_/g, ' ').toLowerCase()}
                    </TD>
                    <TD className="text-white/60">{e.actorRole || '-'}</TD>
                    <TD className="text-white/60">
                      {e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : '-'}
                    </TD>
                    <TD className="text-white/40 truncate max-w-[200px]">
                      {e.metadata ? JSON.stringify(e.metadata) : '-'}
                    </TD>
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
