'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, TableSkeleton, StatusBadge, StatCardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminRfqOverview, useAdminRfqs, useAdminFlaggedRfqs, useAdminRfqAuditTrail } from '@/hooks/use-smart-rfq';
import { Search, FileText, AlertCircle, Flag, ScrollText, RefreshCw, Eye } from 'lucide-react';

type Tab = 'overview' | 'rfqs' | 'flagged' | 'audit';

export default function AdminRfqPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const { data: overview, isLoading: overviewLoading } = useAdminRfqOverview();
  const { data: rfqsData, isLoading: rfqsLoading } = useAdminRfqs({ search: search || undefined });
  const { data: flagged, isLoading: flaggedLoading } = useAdminFlaggedRfqs();
  const { data: audit, isLoading: auditLoading } = useAdminRfqAuditTrail();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="RFQ Management" description="Administer all platform RFQs" />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-1">
        {(['overview', 'rfqs', 'flagged', 'audit'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'
            }`}
          >
            {t === 'overview' && 'Overview'}
            {t === 'rfqs' && 'All RFQs'}
            {t === 'flagged' && 'Flagged'}
            {t === 'audit' && 'Audit Trail'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {overviewLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : overview ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={FileText} label="Total RFQs" value={String(overview.total ?? 0)} />
              <StatCard icon={FileText} label="Draft" value={String(overview.draft ?? 0)} />
              <StatCard icon={Eye} label="Active" value={String(overview.active ?? 0)} changeType="positive" />
              <StatCard icon={AlertCircle} label="Expired" value={String(overview.expired ?? 0)} />
              <StatCard icon={AlertCircle} label="Cancelled" value={String(overview.cancelled ?? 0)} changeType="negative" />
              <StatCard icon={ScrollText} label="Converted" value={String(overview.converted ?? 0)} changeType="positive" />
            </div>
          ) : null}
        </>
      )}

      {tab === 'rfqs' && (
        <>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input placeholder="Search RFQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/[0.04] border-white/[0.06] text-white" />
          </div>
          {rfqsLoading ? <TableSkeleton /> : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
              <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
                <div className="col-span-4">RFQ / Buyer</div>
                <div className="col-span-3">Products</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-3">Status</div>
              </div>
              {(rfqsData?.items ?? []).length === 0 ? (
                <div className="p-12 text-center text-sm text-white/40">No RFQs found</div>
              ) : (
                (rfqsData?.items ?? []).map((rfq: any) => (
                  <div key={rfq.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-4">
                      <p className="text-sm font-medium text-white">{rfq.title || 'Untitled'}</p>
                      <p className="text-xs text-white/40">{rfq.company?.name || 'N/A'}</p>
                    </div>
                    <p className="text-sm text-white/60 lg:col-span-3">{rfq._count?.quotes ?? 0} quotes</p>
                    <p className="text-sm text-white/60 lg:col-span-2">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</p>
                    <div className="lg:col-span-3"><StatusBadge status={rfq.status} /></div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {tab === 'flagged' && (
        flaggedLoading ? <TableSkeleton /> : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
            <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
              <div className="col-span-5">RFQ / Buyer</div>
              <div className="col-span-3">Reason</div>
              <div className="col-span-4">Created</div>
            </div>
            {(flagged?.items ?? []).length === 0 ? (
              <div className="p-12 text-center text-sm text-white/40">No flagged RFQs</div>
            ) : (
              (flagged?.items ?? []).map((rfq: any) => (
                <div key={rfq.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-5">
                    <p className="text-sm font-medium text-white">{rfq.title || 'Untitled'}</p>
                    <p className="text-xs text-white/40">{rfq.company?.name || 'N/A'}</p>
                  </div>
                  <p className="text-sm text-red-400 lg:col-span-3">Flagged</p>
                  <p className="text-sm text-white/60 lg:col-span-4">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              ))
            )}
          </div>
        )
      )}

      {tab === 'audit' && (
        auditLoading ? <TableSkeleton /> : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
            <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
              <div className="col-span-4">Event</div>
              <div className="col-span-4">RFQ</div>
              <div className="col-span-4">Date</div>
            </div>
            {(audit?.items ?? []).length === 0 ? (
              <div className="p-12 text-center text-sm text-white/40">No audit events</div>
            ) : (
              (audit?.items ?? []).map((event: any) => (
                <div key={event.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center">
                  <p className="text-sm text-white lg:col-span-4">{event.event || event.type || 'Event'}</p>
                  <p className="text-sm text-white/60 lg:col-span-4">{event.rfq?.title || event.rfq?.rfqNumber || event.rfqId?.slice(0, 8)}</p>
                  <p className="text-sm text-white/60 lg:col-span-4">{new Date(event.createdAt).toLocaleString('en-IN')}</p>
                </div>
              ))
            )}
          </div>
        )
      )}
    </div>
  );
}
