'use client';

import { DashboardPageHeader, StatCard, StatusBadge, TableSkeleton, StatCardSkeleton } from '@/components/dashboard';
import { usePayments } from '@/hooks';
import { CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import type { Payment } from '@/lib/api/types';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerPaymentsPage() {
  const { data, isLoading, error } = usePayments();
  const transactions = data?.data ?? [];

  const totalSpent = transactions
    .filter((t: Payment) => t.status === 'completed' && t.type !== 'GOCASH_EARNED')
    .reduce((sum: number, t: Payment) => sum + t.amount, 0);

  const pendingCount = transactions.filter((t: Payment) => t.status === 'pending').length;

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Payments" description="Payment history" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load payments</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Payments" description="Payment history" />
        <div className="grid gap-6 sm:grid-cols-2">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Payments"
        description="Payment history"
      />

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <CreditCard className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No payments found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Your payment history will appear here after you make your first purchase.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <StatCard icon={CreditCard} label="Total Spent" value={formatINR(totalSpent)} change="Completed" changeType="neutral" />
            <StatCard icon={DollarSign} label="Pending Payments" value={String(pendingCount)} change={pendingCount === 1 ? '1 transaction' : `${pendingCount} transactions`} changeType="neutral" />
          </div>

          <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
            <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
              <div className="col-span-2">Txn ID</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Status</div>
            </div>
            {transactions.map((txn: Payment) => (
              <div
                key={txn.id}
                className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
              >
                <p className="text-sm font-mono font-medium text-text-primary dark:text-dark-text-primary sm:col-span-2">{txn.id.slice(0, 12)}...</p>
                <p className="text-sm text-text-primary dark:text-dark-text-primary sm:col-span-3">{txn.type.replace(/_/g, ' ')}</p>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary sm:col-span-2">{formatINR(txn.amount)}</p>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</p>
                <div className="sm:col-span-3">
                  <StatusBadge status={txn.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
