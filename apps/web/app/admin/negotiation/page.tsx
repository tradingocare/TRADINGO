'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import {
  useAdminNegotiationOverview, useAdminNegotiations, useAdminFlaggedNegotiations, useAdminNegotiationAudit,
} from '@/hooks/use-smart-negotiation';
import {
  MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle, Activity,
} from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'negotiations', label: 'All Negotiations' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'audit', label: 'Audit' },
] as const;

type Tab = typeof TABS[number]['key'];

function StatCardSkeleton() {
  return <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  );
}

const formatStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function AdminNegotiationPage() {
  const [tab, setTab] = useState<Tab>('overview');

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

      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.04] p-1 backdrop-blur-xl">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          {negotiationsLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Buyer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Versions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {negotiationsData?.data?.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-white/40">No negotiations found</td></tr>
                  ) : (
                    negotiationsData?.data?.map((n: any) => (
                      <tr key={n.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm text-white">{n.buyerCompany?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-white">{n.sellerCompany?.name || '-'}</td>
                        <td className="px-4 py-3"><StatusBadge status={formatStatus(n.status)} /></td>
                        <td className="px-4 py-3 text-sm text-white/80">
                          {n.quote?.currency || 'INR'} {n.quote?.totalAmount?.toLocaleString('en-IN') || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60">{n._count?.versions || 0}</td>
                        <td className="px-4 py-3 text-sm text-white/60">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Flagged Tab */}
      {tab === 'flagged' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          {flaggedLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Buyer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">RFQ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedData?.data?.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-white/40">No flagged negotiations</td></tr>
                  ) : (
                    flaggedData?.data?.map((n: any) => (
                      <tr key={n.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm text-white">{n.buyerCompany?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-white">{n.sellerCompany?.name || '-'}</td>
                        <td className="px-4 py-3"><StatusBadge status={formatStatus(n.status)} /></td>
                        <td className="px-4 py-3 text-sm text-white/60 truncate max-w-[200px]">{n.rfq?.title || '-'}</td>
                        <td className="px-4 py-3 text-sm text-white/60">
                          {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {tab === 'audit' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          {auditLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Actor Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-white/40">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {auditData?.data?.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-white/40">No audit events</td></tr>
                  ) : (
                    auditData?.data?.map((e: any) => (
                      <tr key={e.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm text-white capitalize">
                          {e.eventType?.replace(/_/g, ' ').toLowerCase()}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60">{e.actorRole || '-'}</td>
                        <td className="px-4 py-3 text-sm text-white/60">
                          {e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/40 truncate max-w-[200px]">
                          {e.metadata ? JSON.stringify(e.metadata) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
