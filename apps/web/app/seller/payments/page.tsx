'use client';

import { DashboardPageHeader, StatCard, StatusBadge, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { usePayments, useGocashBalance } from '@/hooks';
import { DollarSign, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Payment } from '@/lib/api/types';

export default function SellerPaymentsPage() {
  const { data: payments, isLoading: paymentsLoading, error: paymentsError } = usePayments();
  const { data: balance, isLoading: balanceLoading } = useGocashBalance();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Payments"
        description="Track your earnings and transactions"
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      {balanceLoading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <StatCard icon={DollarSign} label="GOCASH Balance" value={`₹${(balance?.balance ?? 0).toLocaleString('en-IN')}`} change="Available" changeType="neutral" />
          <StatCard icon={Clock} label="Total Transactions" value={String(payments?.total ?? 0)} change="All time" changeType="neutral" />
        </div>
      )}

      {paymentsLoading ? (
        <TableSkeleton />
      ) : paymentsError ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load payments. Please try again.</p>
        </div>
      ) : !payments?.data?.length ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <DollarSign className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No transactions yet</h3>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Your payment history will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-2">Transaction</div>
            <div className="col-span-2">From</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-3">Date</div>
          </div>
          {payments.data.map((txn: Payment) => (
            <div key={txn.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border">
              <p className="text-xs font-mono font-medium text-text-primary dark:text-dark-text-primary sm:col-span-2">#{txn.id.slice(0, 8)}</p>
              <p className="text-sm text-text-primary dark:text-dark-text-primary sm:col-span-2">{txn.fromId}</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary capitalize sm:col-span-2">{txn.type.replace(/_/g, ' ').toLowerCase()}</p>
              <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary sm:col-span-2">₹{txn.amount.toLocaleString('en-IN')}</p>
              <div className="sm:col-span-1">
                <StatusBadge status={txn.status} />
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-3">{new Date(txn.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
