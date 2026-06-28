'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, StatCard, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSmartRfqs } from '@/hooks/use-smart-rfq';
import { Search, FileText, AlertCircle, DollarSign, Scale, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function BuyerQuotePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useSmartRfqs({ search: search || undefined });
  const rfqs = Array.isArray(data) ? data.filter((r: any) => r.status !== 'DRAFT') : [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Quotation Inbox" description="Compare and manage quotes from sellers" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Active Quotes" value={String(rfqs.filter((r: any) => r.status === 'QUOTED' || r.status === 'NEGOTIATING').length)} />
        <StatCard icon={CheckCircle} label="Accepted" value={String(rfqs.filter((r: any) => r.status === 'ACCEPTED' || r.status === 'CONVERTED').length)} changeType="positive" />
        <StatCard icon={Eye} label="Pending Review" value={String(rfqs.filter((r: any) => r.status === 'ACTIVE' || r.status === 'MATCHED').length)} />
        <StatCard icon={AlertCircle} label="Expired" value={String(rfqs.filter((r: any) => r.status === 'EXPIRED').length)} />
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input placeholder="Search RFQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/[0.04] border-white/[0.06] text-white" />
      </div>

      {isLoading ? <TableSkeleton /> : rfqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <FileText className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No quotes yet</p>
          <p className="mt-1 text-sm text-white/60">Quotes from sellers will appear here once your RFQs receive responses.</p>
          <Button variant="accent" className="mt-4" onClick={() => router.push('/buyer/rfq/new')}>Create RFQ</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
            <div className="col-span-3">RFQ</div>
            <div className="col-span-2">Quotes</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-2">Updated</div>
            <div className="col-span-3">Actions</div>
          </div>
          {rfqs.map((rfq: any) => (
            <div key={rfq.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-3">
                <p className="text-sm font-medium text-white">{rfq.title || 'RFQ'}</p>
                <StatusBadge status={rfq.status} />
              </div>
              <p className="text-sm text-white/60 lg:col-span-2">{rfq.quoteCount ?? 0} quotes</p>
              <p className="text-sm text-white/60 lg:col-span-2">
                {rfq.showBudget && rfq.budgetMin ? `₹${rfq.budgetMin} - ₹${rfq.budgetMax}` : '-'}
              </p>
              <p className="text-sm text-white/60 lg:col-span-2">{new Date(rfq.updatedAt).toLocaleDateString('en-IN')}</p>
              <div className="flex items-center gap-2 lg:col-span-3">
                <Button variant="accent" size="sm" onClick={() => router.push(`/buyer/quote/compare?rfqId=${rfq.id}`)} disabled={!rfq.quoteCount}>
                  <Scale className="mr-1 h-3 w-3" />Compare
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push(`/buyer/rfq/${rfq.id}`)}>
                  <Eye className="mr-1 h-3 w-3" />View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
