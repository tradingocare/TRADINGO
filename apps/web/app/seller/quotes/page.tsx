'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useQuotes } from '@/hooks';
import { FileText, Calendar, DollarSign } from 'lucide-react';
import type { Quote } from '@/lib/api/types';

export default function SellerQuotesPage() {
  const { data, isLoading, error } = useQuotes();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Quotes"
        description="Track your submitted quotes"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load quotes. Please try again.</p>
        </div>
      ) : !data?.data?.length ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <FileText className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No quotes yet</h3>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Quotes you submit to buyers will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">RFQ</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Expiry</div>
            <div className="col-span-3" />
          </div>
          {data.data.map((quote: Quote) => (
            <div key={quote.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border">
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">RFQ-{quote.rfqId.slice(0, 8)}</p>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <DollarSign className="h-3.5 w-3.5 text-text-tertiary" />
                <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">₹{quote.amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="sm:col-span-2">
                <StatusBadge status={quote.status} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{new Date(quote.validityDate).toLocaleDateString()}</p>
              </div>
              <div className="sm:col-span-3 sm:text-right">
                <span className="text-xs font-medium text-primary-600 hover:underline cursor-pointer dark:text-primary-400">View Details</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
