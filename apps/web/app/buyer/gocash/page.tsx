'use client';

import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { useGocashBalance, useGocashHistory } from '@/hooks';
import { Award, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import type { GocashEntry } from '@/lib/api/types';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerGocashPage() {
  const { data: balanceData, isLoading: balanceLoading } = useGocashBalance();
  const { data: historyData, isLoading: historyLoading, error: historyError } = useGocashHistory();
  const transactions = historyData?.data ?? [];
  const balance = balanceData?.balance ?? 0;

  if (historyError) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="GOCASH Rewards" description="Earn and manage your reward points" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load GOCASH history</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{historyError.message}</p>
        </div>
      </div>
    );
  }

  if (balanceLoading || historyLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="GOCASH Rewards" description="Earn and manage your reward points" />
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <StatCardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="GOCASH Rewards"
        description="Earn and manage your reward points"
      />

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        <StatCard icon={Award} label="GOCASH Balance" value={formatINR(balance)} change="Available" changeType="neutral" />
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Award className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No transactions yet</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Your GOCASH reward history will appear here once you start earning.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="border-b border-border px-6 py-4 dark:border-dark-border">
            <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Transaction History</h3>
          </div>
          <div className="divide-y divide-border dark:divide-dark-border">
            {transactions.map((txn: GocashEntry) => (
              <div key={txn.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      txn.type === 'earned'
                        ? 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {txn.type === 'earned' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{txn.description}</p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      txn.type === 'earned'
                        ? 'text-accent-600 dark:text-accent-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {txn.type === 'earned' ? '+' : '-'}{formatINR(txn.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
