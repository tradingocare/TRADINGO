'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useRfqs } from '@/hooks';
import { FileText, AlertCircle } from 'lucide-react';
import type { Rfq } from '@/lib/api/types';

export default function AdminRfqsPage() {
  const { data, isLoading, error } = useRfqs();
  const rfqs = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Management" description="Monitor all RFQs across the platform" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load RFQs</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Management" description="Monitor all RFQs across the platform" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="RFQ Management"
        description="Monitor all RFQs across the platform"
      />

      {rfqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <FileText className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No RFQs found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">RFQs from across the platform will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Company ID</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-1">Responses</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
          </div>
          {rfqs.map((rfq: Rfq) => (
            <div
              key={rfq.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
            >
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{rfq.productName}</p>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{rfq.companyId.slice(0, 8)}...</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{rfq.quantity} {rfq.unit}</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-1">{rfq.responseCount ?? 'N/A'}</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={rfq.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
