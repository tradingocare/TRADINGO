'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardPageHeader, StatCard, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { apiClient } from '@/lib/api/client';
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

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-1">
        {(['overview', 'quotes', 'flagged', 'trends'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white/80'
            }`}>
            {t === 'overview' ? 'Overview' : t === 'quotes' ? 'All Quotes' : t === 'flagged' ? 'Flagged' : 'Pricing Trends'}
          </button>
        ))}
      </div>

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
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
                <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-4">Conversion Rate</h3>
                <p className="text-3xl font-bold text-white">{overview?.conversionRate ?? 0}%</p>
                <p className="mt-1 text-sm text-white/50">of submitted quotes get accepted</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
                <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-4">Average Quote Amount</h3>
                <p className="text-3xl font-bold text-white">₹{Number(overview?.avgAmount || 0).toLocaleString('en-IN')}</p>
                <p className="mt-1 text-sm text-white/50">across all submitted quotations</p>
              </div>
            </div>
          </>
        )
      )}

      {tab === 'quotes' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input type="text" placeholder="Search quotes..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-white/[0.09] bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 backdrop-blur-md focus:border-[#FF4D00]/30 focus:outline-none" />
            </div>
          </div>
          {quotesLoading ? <TableSkeleton rows={5} /> : quotes.length === 0 ? (
            <div className="p-12 text-center text-sm text-white/40">No quotes found.</div>
          ) : (
            <>
              <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
                {columns.map((c) => <div key={c} className={c === 'RFQ' ? 'col-span-4' : 'col-span-2'}>{c}</div>)}
              </div>
              {quotes.map((q: any) => (
                <div key={q.id} className="grid grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-sm last:border-0">
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <Flag className="h-8 w-8 text-white/30" />
          <p className="mt-3 text-sm text-white/60">No flagged quotations at this time.</p>
        </div>
      )}

      {tab === 'trends' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-4">
              <TrendingUp className="inline h-3 w-3 mr-1" />Average Quote Value by Category
            </h3>
            <p className="text-sm text-white/40">Chart integration coming in next phase.</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-4">
              <TrendingUp className="inline h-3 w-3 mr-1" />Quote Audit Trail
            </h3>
            <p className="text-sm text-white/40">Recent quotation events will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
