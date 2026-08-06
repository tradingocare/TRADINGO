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
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
          <AlertCircle className="h-12 w-12 text-status-error" />
          <p className="mt-4 text-lg font-medium text-text-primary">Failed to load quotes</p>
          <p className="mt-1 text-sm text-text-secondary">{error.message}</p>
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
          <Quote className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary">No quotes found</p>
          <p className="mt-1 text-sm text-text-secondary">Quotes from sellers will appear here once your RFQs receive responses.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary sm:grid">
            <div className="col-span-3">Seller ID</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Delivery Time</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Validity</div>
          </div>
          {quotes.map((quote: QuoteType) => (
            <div
              key={quote.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center"
            >
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Quote className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary">{quote.sellerId.slice(0, 8)}...</p>
              </div>
              <p className="text-sm font-medium text-text-primary sm:col-span-2">{formatINR(quote.amount)}</p>
              <p className="text-sm text-text-secondary sm:col-span-2">{quote.deliveryDays ? `${quote.deliveryDays} days` : 'N/A'}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={quote.status} />
              </div>
              <p className="text-sm text-text-secondary sm:col-span-3">{new Date(quote.validityDate).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
