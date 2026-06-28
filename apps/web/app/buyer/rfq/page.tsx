'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge, StatCard, TableSkeleton, StatCardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSmartRfqs } from '@/hooks/use-smart-rfq';
import { Plus, FileText, AlertCircle, Search, Filter, RefreshCw, Copy, Archive, XCircle, Clock, CheckCircle, Send, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusTabs = ['ALL', 'DRAFT', 'ACTIVE', 'MATCHED', 'QUOTED', 'NEGOTIATING', 'CONVERTED', 'CLOSED', 'EXPIRED', 'CANCELLED'];

export default function BuyerRfqDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const params = { status: status === 'ALL' ? undefined : status, search: search || undefined };
  const { data, isLoading, error } = useSmartRfqs(params);
  const rfqs = Array.isArray(data) ? data : data?.data ?? [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My RFQs"
        description="Manage your requests for quotes"
        actions={
          <Link href="/buyer/rfq/new">
            <Button variant="accent">
              <Plus className="mr-2 h-4 w-4" />
              New RFQ
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total RFQs" value={Array.isArray(data) ? String(data.length) : '0'} />
        <StatCard icon={Send} label="Active" value={rfqs.filter((r: any) => r.status === 'ACTIVE').toString()} changeType="positive" />
        <StatCard icon={CheckCircle} label="Converted" value={rfqs.filter((r: any) => r.status === 'CONVERTED').toString()} changeType="positive" />
        <StatCard icon={XCircle} label="Drafts" value={rfqs.filter((r: any) => r.status === 'DRAFT').toString()} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search RFQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
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
        <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
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
          <p className="mt-4 text-lg font-medium text-white">No RFQs found</p>
          <p className="mt-1 text-sm text-white/60">Create your first request for quote to get started.</p>
          <Link href="/buyer/rfq/new" className="mt-4">
            <Button variant="accent">
              <Plus className="mr-2 h-4 w-4" />
              New RFQ
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
            <div className="col-span-4">RFQ</div>
            <div className="col-span-2">Products</div>
            <div className="col-span-2">Quotes</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2">Status</div>
          </div>
          {rfqs.map((rfq: any) => (
            <div
              key={rfq.id}
              onClick={() => router.push(`/buyer/rfq/${rfq.id}`)}
              className="grid cursor-pointer grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 transition-colors hover:bg-white/[0.02] lg:grid-cols-12 lg:items-center"
            >
              <div className="flex items-center gap-3 lg:col-span-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{rfq.title || rfq.productName || 'Untitled RFQ'}</p>
                  <p className="text-xs text-white/40">{rfq.rfqNumber || rfq.id?.slice(0, 8)}</p>
                </div>
              </div>
              <p className="text-sm text-white/60 lg:col-span-2">{rfq.productItems?.length ?? rfq.quantity ?? 0}</p>
              <p className="text-sm text-white/60 lg:col-span-2">{rfq.quoteCount ?? rfq.responseCount ?? 0}</p>
              <p className="text-sm text-white/60 lg:col-span-2">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="lg:col-span-2">
                <StatusBadge status={rfq.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
