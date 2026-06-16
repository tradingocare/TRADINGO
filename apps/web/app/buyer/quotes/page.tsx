'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useQuotes } from '@/hooks';
import { Quote, AlertCircle } from 'lucide-react';
import type { Quote as QuoteType } from '@/lib/api/types';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerQuotesPage() {
  const { data, isLoading, error } = useQuotes();
  const quotes = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Received Quotes" description="Compare quotes from sellers" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load quotes</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Received Quotes" description="Compare quotes from sellers" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Received Quotes"
        description="Compare quotes from sellers"
      />

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Quote className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No quotes found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Quotes from sellers will appear here once your RFQs receive responses.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">Seller ID</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Delivery Time</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Validity</div>
          </div>
          {quotes.map((quote: QuoteType) => (
            <div
              key={quote.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
            >
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Quote className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{quote.sellerId.slice(0, 8)}...</p>
              </div>
              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary sm:col-span-2">{formatINR(quote.amount)}</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{quote.deliveryDays ? `${quote.deliveryDays} days` : 'N/A'}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={quote.status} />
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-3">{new Date(quote.validityDate).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
