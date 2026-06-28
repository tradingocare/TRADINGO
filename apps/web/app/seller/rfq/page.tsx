'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, StatCard, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSellerIncomingRfqs, useSellerRfqStats } from '@/hooks/use-smart-rfq';
import { Search, FileText, AlertCircle, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';

const statusTabs = ['ALL', 'SENT', 'VIEWED', 'QUOTED', 'DECLINED', 'EXPIRED'];

export default function SellerRfqPage() {
  const router = useRouter();
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const params = { status: status === 'ALL' ? undefined : status, search: search || undefined };
  const { data, isLoading, error } = useSellerIncomingRfqs(params);
  const { data: stats } = useSellerRfqStats();
  const rfqs = Array.isArray(data) ? data : data?.data ?? [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Incoming RFQs" description="RFQs matched to your business" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total" value={String(stats?.total ?? 0)} />
        <StatCard icon={Eye} label="New Matches" value={String(stats?.matched ?? 0)} />
        <StatCard icon={CheckCircle} label="Accepted" value={String(stats?.quoted ?? 0)} changeType="positive" />
        <StatCard icon={XCircle} label="Declined" value={String(stats?.declined ?? 0)} changeType="negative" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search RFQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/[0.04] border-white/[0.06] text-white"
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
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-white">Failed to load RFQs</p>
          <p className="mt-1 text-sm text-white/60">{(error as any).message}</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} />
      ) : rfqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <FileText className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No incoming RFQs</p>
          <p className="mt-1 text-sm text-white/60">New RFQ matches will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
            <div className="col-span-4">Buyer / RFQ</div>
            <div className="col-span-2">Products</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-2">Received</div>
            <div className="col-span-2">Status</div>
          </div>
          {rfqs.map((rfq: any) => (
            <div
              key={rfq.id}
              onClick={() => router.push(`/seller/rfq/${rfq.id}`)}
              className="grid cursor-pointer grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 transition-colors hover:bg-white/[0.02] lg:grid-cols-12 lg:items-center"
            >
              <div className="flex items-center gap-3 lg:col-span-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{rfq.title || rfq.productName || 'RFQ'}</p>
                  <p className="text-xs text-white/40">{rfq.company?.name || 'Buyer'}</p>
                </div>
              </div>
              <p className="text-sm text-white/60 lg:col-span-2">{rfq.productItems?.length ?? rfq.quantity ?? '-'}</p>
              <p className="text-sm text-white/60 lg:col-span-2">
                {rfq.budgetMin || rfq.budgetMax ? `₹${rfq.budgetMin || 0} - ₹${rfq.budgetMax || 0}` : '-'}
              </p>
              <p className="text-sm text-white/60 lg:col-span-2">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="flex items-center gap-2 lg:col-span-2">
                <StatusBadge status={rfq.vendorMatches?.[0]?.status || rfq.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
