'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, StatCard, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, AlertCircle, Plus, DollarSign } from 'lucide-react';
import { useSmartRfqs } from '@/hooks/use-smart-rfq';

export default function SellerQuotePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useSmartRfqs({ search: search || undefined });
  const rfqs = Array.isArray(data) ? data.filter((r: any) => r.status === 'ACTIVE' || r.status === 'QUOTED') : [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Quotes"
        description="Manage quotations for matched RFQs"
        actions={
          <div className="relative">
            <Button variant="accent" onClick={() => router.push('/seller/rfq')}>
              <Plus className="mr-2 h-4 w-4" />New Quote
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={FileText} label="Active RFQs" value={String(rfqs.filter((r: any) => r.status === 'ACTIVE').length)} />
        <StatCard icon={DollarSign} label="Quoted" value={String(rfqs.filter((r: any) => r.status === 'QUOTED').length)} changeType="positive" />
        <StatCard icon={AlertCircle} label="Pending Response" value={String(rfqs.filter((r: any) => r.status === 'ACTIVE').length)} />
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input placeholder="Search RFQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/[0.04] border-white/[0.06] text-white" />
      </div>

      {isLoading ? <TableSkeleton /> : rfqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <FileText className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No active RFQs to quote on</p>
          <p className="mt-1 text-sm text-white/60">Check incoming RFQs to find matching opportunities.</p>
          <Button variant="accent" className="mt-4" onClick={() => router.push('/seller/rfq')}>View Incoming RFQs</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
            <div className="col-span-4">RFQ</div>
            <div className="col-span-2">Products</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-2">Received</div>
            <div className="col-span-2">Action</div>
          </div>
          {rfqs.map((rfq: any) => (
            <div key={rfq.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-4">
                <p className="text-sm font-medium text-white">{rfq.title || 'RFQ'}</p>
                <p className="text-xs text-white/40">{rfq.company?.name || 'Buyer'}</p>
              </div>
              <p className="text-sm text-white/60 lg:col-span-2">{rfq.productItems?.length ?? '-'}</p>
              <p className="text-sm text-white/60 lg:col-span-2">{rfq.budgetMin ? `₹${rfq.budgetMin} - ₹${rfq.budgetMax}` : '-'}</p>
              <p className="text-sm text-white/60 lg:col-span-2">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="lg:col-span-2">
                <Button variant="accent" size="sm" onClick={() => router.push(`/seller/quote/new?rfqId=${rfq.id}`)}>
                  <Plus className="mr-1 h-3 w-3" />Quote
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
