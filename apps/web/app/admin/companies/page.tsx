'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useCompanies } from '@/hooks';
import { Building2, AlertCircle } from 'lucide-react';
import type { Company } from '@/lib/api/types';

export default function AdminCompaniesPage() {
  const { data, isLoading, error } = useCompanies();
  const companies = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Companies" description="Manage registered companies" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load companies</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Companies" description="Manage registered companies" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Companies"
        description="Manage registered companies"
      />

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Building2 className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No companies found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Companies will appear here once users register their business.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-4">Company</div>
            <div className="col-span-2">Owner ID</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Verification</div>
            <div className="col-span-2">Status</div>
          </div>
          {companies.map((company: Company) => (
            <div
              key={company.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
            >
              <div className="flex items-center gap-3 sm:col-span-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{company.name}</p>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{company.ownerId.slice(0, 8)}...</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{company.type}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={company.verificationStatus} />
              </div>
              <div className="sm:col-span-2">
                <StatusBadge status={company.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
