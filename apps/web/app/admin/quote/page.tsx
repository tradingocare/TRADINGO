'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, DollarSign, FileText, AlertCircle, TrendingUp, Flag, ScrollText } from 'lucide-react';

type Tab = 'overview' | 'quotes' | 'flagged' | 'trends';

const MOCK_OVERVIEW = { totalQuotes: 1248, submitted: 892, accepted: 156, rejected: 89, expired: 111, avgAmount: 284500, conversionRate: 17.5 };

const columns = ['RFQ', 'Seller', 'Amount', 'Status', 'Date'];

export default function AdminQuotePage() {
  const [tab, setTab] = useState<Tab>('overview');

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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={DollarSign} label="Total Quotes" value={String(MOCK_OVERVIEW.totalQuotes)} />
            <StatCard icon={FileText} label="Submitted" value={String(MOCK_OVERVIEW.submitted)} />
            <StatCard icon={AlertCircle} label="Accepted" value={String(MOCK_OVERVIEW.accepted)} changeType="positive" />
            <StatCard icon={AlertCircle} label="Rejected" value={String(MOCK_OVERVIEW.rejected)} changeType="negative" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-4">Conversion Rate</h3>
              <p className="text-3xl font-bold text-white">{MOCK_OVERVIEW.conversionRate}%</p>
              <p className="mt-1 text-sm text-white/50">of submitted quotes get accepted</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-4">Average Quote Amount</h3>
              <p className="text-3xl font-bold text-white">₹{MOCK_OVERVIEW.avgAmount.toLocaleString('en-IN')}</p>
              <p className="mt-1 text-sm text-white/50">across all submitted quotations</p>
            </div>
          </div>
        </>
      )}

      {tab === 'quotes' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
            {columns.map((c) => <div key={c} className={c === 'RFQ' ? 'col-span-4' : 'col-span-2'}>{c}</div>)}
          </div>
          <div className="p-12 text-center text-sm text-white/40">Quotation data will appear here from the live API.</div>
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
              <ScrollText className="inline h-3 w-3 mr-1" />Quote Audit Trail
            </h3>
            <p className="text-sm text-white/40">Recent quotation events will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
