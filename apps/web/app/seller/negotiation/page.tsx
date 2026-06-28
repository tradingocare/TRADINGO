'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyNegotiations } from '@/hooks/use-smart-negotiation';
import { Search, MessageSquare, ArrowRight, DollarSign, AlertCircle } from 'lucide-react';

const formatNegotiationStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function SellerNegotiationPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: negotiations, isLoading } = useMyNegotiations(statusFilter || undefined);

  const list = Array.isArray(negotiations) ? negotiations : [];

  const tabs = [
    { label: 'All', value: '' },
    { label: 'New', value: 'NEGOTIATION_STARTED' },
    { label: 'Buyer Countered', value: 'BUYER_COUNTER' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Negotiation Requests"
        description="Respond to buyer counter offers and close deals"
      />

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-white/[0.04] text-white/60 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          placeholder="Search negotiations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/[0.04] border-white/[0.06] text-white"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <MessageSquare className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No negotiations yet</p>
          <p className="mt-1 text-sm text-white/60">When buyers start negotiations on your quotes, they will appear here.</p>
          <Button variant="accent" className="mt-4" onClick={() => router.push('/seller/quote')}>
            View My Quotes
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
            <div className="col-span-3">Buyer / RFQ</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Offer</div>
            <div className="col-span-2">Last Updated</div>
            <div className="col-span-1 text-center">Versions</div>
            <div className="col-span-2">Action</div>
          </div>
          {list.map((n: any) => (
            <div
              key={n.id}
              className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center hover:bg-white/[0.02] cursor-pointer"
              onClick={() => router.push(`/seller/negotiation/${n.id}`)}
            >
              <div className="lg:col-span-3">
                <p className="text-sm font-medium text-white">{n.buyerCompany?.name || 'N/A'}</p>
                <p className="text-xs text-white/40 truncate">{n.rfq?.title || ''}</p>
              </div>
              <div className="lg:col-span-2">
                <StatusBadge status={formatNegotiationStatus(n.status)} />
              </div>
              <div className="flex items-center gap-1 lg:col-span-2">
                <DollarSign className="h-3 w-3 text-white/40" />
                <span className="text-sm text-white/80">
                  {n.quote?.currency || 'INR'} {n.quote?.totalAmount?.toLocaleString('en-IN') || '-'}
                </span>
              </div>
              <p className="text-sm text-white/60 lg:col-span-2">
                {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-IN') : '-'}
              </p>
              <p className="text-center text-sm text-white/60 lg:col-span-1">{n._count?.versions || 0}</p>
              <div className="lg:col-span-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/seller/negotiation/${n.id}`); }}>
                  <ArrowRight className="mr-1 h-3 w-3" />Respond
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
