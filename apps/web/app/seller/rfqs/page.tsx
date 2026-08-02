'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useRfqs } from '@/hooks';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { Rfq } from '@/lib/api/types';

export default function SellerRfqsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useRfqs();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="RFQs Received"
        description="Review and respond to buyer requests"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <EmptyState icon={AlertCircle} variant="error" title="Failed to load RFQs" description="Please try again later." />
      ) : !data?.data?.length ? (
        <EmptyState icon={FileText} title="No RFQs yet" description="Buyer requests will appear here." />
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2" />
          </div>
          {data.data.map((rfq: Rfq) => (
            <div key={rfq.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border">
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{rfq.productName}</p>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{rfq.quantity} {rfq.unit}</p>
              <p className="text-sm text-text-primary dark:text-dark-text-primary sm:col-span-2">{rfq.budget ? `₹${rfq.budget.toLocaleString('en-IN')}` : '—'}</p>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{new Date(rfq.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="sm:col-span-1">
                <StatusBadge status={rfq.status} />
              </div>
              <div className="sm:col-span-2 sm:text-right">
                <span className="text-xs font-medium text-primary-600 hover:underline cursor-pointer dark:text-primary-400" onClick={() => router.push(`/seller/rfq/${rfq.id}`)}>View</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
