'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyNegotiations } from '@/hooks/use-smart-negotiation';
import { Search, MessageSquare, ArrowRight, DollarSign, Clock, AlertCircle } from 'lucide-react';

const formatNegotiationStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function BuyerNegotiationPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: negotiations, isLoading, isError } = useMyNegotiations(statusFilter || undefined);

  const list = Array.isArray(negotiations) ? negotiations : [];

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'NEGOTIATION_STARTED' },
    { label: 'Countered', value: 'SELLER_COUNTER' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Negotiations"
        description="Track and manage ongoing price and terms discussions with sellers"
      />

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-accent/20 text-accent'
                : 'bg-surface/20 text-text-tertiary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          placeholder="Search negotiations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-surface/20 border-border/5 text-text-primary placeholder-text-tertiary"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/5 bg-surface/20 p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-status-error" />
          <p className="mt-4 text-lg font-medium text-text-primary">Failed to load negotiations</p>
          <p className="mt-1 text-sm text-text-tertiary">Something went wrong. Please try again.</p>
          <Button variant="accent" className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/5 bg-surface/20 p-12 backdrop-blur-xl">
          <MessageSquare className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary">No negotiations yet</p>
          <p className="mt-1 text-sm text-text-tertiary">Start a negotiation from a quote in your inbox to discuss pricing and terms.</p>
          <Button variant="accent" className="mt-4" onClick={() => router.push('/buyer/quote')}>
            View Quotes
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/5 bg-surface/20 backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-border/5 px-6 py-3 text-xs font-medium uppercase text-text-tertiary lg:grid">
            <div className="col-span-3">Supplier / RFQ</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Current Offer</div>
            <div className="col-span-2">Last Updated</div>
            <div className="col-span-1 text-center">Versions</div>
            <div className="col-span-2">Action</div>
          </div>
          {list.map((n: any) => (
            <div
              key={n.id}
              className="grid grid-cols-1 gap-3 border-b border-border/5 px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center hover:bg-surface/10 cursor-pointer"
              onClick={() => router.push(`/buyer/negotiation/${n.id}`)}
            >
              <div className="lg:col-span-3">
                <p className="text-sm font-medium text-text-primary">{n.sellerCompany?.name || 'N/A'}</p>
                <p className="text-xs text-text-tertiary truncate">{n.rfq?.title || ''}</p>
              </div>
              <div className="lg:col-span-2">
                <StatusBadge status={formatNegotiationStatus(n.status)} />
              </div>
              <div className="flex items-center gap-1 lg:col-span-2">
                <DollarSign className="h-3 w-3 text-text-tertiary" />
                <span className="text-sm text-text-primary">
                  {n.quote?.currency || 'INR'} {n.quote?.totalAmount?.toLocaleString('en-IN') || '-'}
                </span>
              </div>
              <p className="text-sm text-text-tertiary lg:col-span-2">
                {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-IN') : '-'}
              </p>
              <p className="text-center text-sm text-text-tertiary lg:col-span-1">{n._count?.versions || 0}</p>
              <div className="lg:col-span-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/buyer/negotiation/${n.id}`); }}>
                  <ArrowRight className="mr-1 h-3 w-3" />View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
