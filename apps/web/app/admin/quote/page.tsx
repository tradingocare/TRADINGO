'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardPageHeader, StatCard, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { apiClient } from '@/lib/api/client';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import { DollarSign, FileText, AlertCircle, TrendingUp, Flag, Search } from 'lucide-react';

type Tab = 'overview' | 'quotes' | 'flagged' | 'trends';
const columns = ['RFQ', 'Seller', 'Amount', 'Status', 'Date'];

export default function AdminQuotePage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'quotes', 'overview'],
    queryFn: () => apiClient.get('/quotes/admin/overview').then(r => r.data),
    enabled: tab === 'overview',
  });

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['admin', 'quotes', 'list', search],
    queryFn: () => apiClient.get('/admin/quotes', { params: { search: search || undefined, limit: 50 } }).then(r => r.data),
    enabled: tab === 'quotes',
  });

  const quotes = quotesData?.data || [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Quotation Management" description="Monitor all platform quotations" />

      <Tabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'quotes', label: 'All Quotes' }, { value: 'flagged', label: 'Flagged' }, { value: 'trends', label: 'Pricing Trends' }]} value={tab} onChange={(v) => setTab(v as Tab)} className="rounded-xl border border-border bg-surface p-1" />

      {tab === 'overview' && (
        overviewLoading ? <TableSkeleton rows={4} /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={DollarSign} label="Total Quotes" value={String(overview?.totalQuotes ?? 0)} />
              <StatCard icon={FileText} label="Submitted" value={String(overview?.submitted ?? 0)} />
              <StatCard icon={AlertCircle} label="Accepted" value={String(overview?.accepted ?? 0)} changeType="positive" />
              <StatCard icon={AlertCircle} label="Rejected" value={String(overview?.rejected ?? 0)} changeType="negative" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-5 backdrop-blur-xl">
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-4">Conversion Rate</h3>
                <p className="text-3xl font-bold text-text-primary">{overview?.conversionRate ?? 0}%</p>
                <p className="mt-1 text-sm text-text-tertiary">of submitted quotes get accepted</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5 backdrop-blur-xl">
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-4">Average Quote Amount</h3>
                <p className="text-3xl font-bold text-text-primary">₹{Number(overview?.avgAmount || 0).toLocaleString('en-IN')}</p>
                <p className="mt-1 text-sm text-text-tertiary">across all submitted quotations</p>
              </div>
            </div>
          </>
        )
      )}

      {tab === 'quotes' && (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-border px-6 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input type="text" placeholder="Search quotes..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-tertiary backdrop-blur-md focus:border-[#f59e0b]/30 focus:outline-none" />
            </div>
          </div>
          {quotesLoading ? <TableSkeleton rows={5} /> : quotes.length === 0 ? (
            <EmptyState variant="empty" title="No quotes found" className="!bg-transparent !border-0" />
          ) : (
            <>
              <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-tertiary lg:grid">
                {columns.map((c) => <div key={c} className={c === 'RFQ' ? 'col-span-4' : 'col-span-2'}>{c}</div>)}
              </div>
              {quotes.map((q: any) => (
                <div key={q.id} className="grid grid-cols-12 gap-4 border-b border-border px-6 py-3 text-sm last:border-0">
                  <div className="col-span-4 text-white font-medium truncate">{q.rfq?.title || q.rfqId}</div>
                  <div className="col-span-2 text-white/60">{q.company?.name || 'N/A'}</div>
                  <div className="col-span-2 text-white">₹{Number(q.totalAmount || q.subtotal || 0).toLocaleString('en-IN')}</div>
                  <div className="col-span-2"><StatusBadge status={q.status} /></div>
                  <div className="col-span-2 text-white/40 text-xs">{new Date(q.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'flagged' && (
        <EmptyState icon={Flag} title="No flagged quotations" description="No flagged quotations at this time." />
      )}

      {tab === 'trends' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-4">
              <TrendingUp className="inline h-3 w-3 mr-1" />Average Quote Value by Category
            </h3>
            <p className="text-sm text-text-tertiary">Chart integration coming in next phase.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-4">
              <TrendingUp className="inline h-3 w-3 mr-1" />Quote Audit Trail
            </h3>
            <p className="text-sm text-text-tertiary">Recent quotation events will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
