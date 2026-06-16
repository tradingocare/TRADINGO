'use client';

import { DashboardPageHeader, StatCard, DashboardSkeleton } from '@/components/dashboard';
import { useUsers, useCompanies, useRfqs, useKycSubmissions } from '@/hooks';
import { Users, Building2, FileText, ShieldCheck, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
  { label: 'User Management', href: '/admin/users', icon: Users, description: 'Manage all platform users' },
  { label: 'Company Verification', href: '/admin/companies', icon: Building2, description: 'Verify registered companies' },
  { label: 'KYC Reviews', href: '/admin/kyc', icon: ShieldCheck, description: 'Review pending verifications' },
  { label: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3, description: 'View platform metrics' },
];

export default function AdminDashboardPage() {
  const { data: usersData, isLoading: usersLoad } = useUsers({ limit: 1 });
  const { data: companiesData, isLoading: companiesLoad } = useCompanies({ limit: 1 });
  const { data: rfqsData, isLoading: rfqsLoad } = useRfqs({ limit: 1 });
  const { data: kycData, isLoading: kycLoad } = useKycSubmissions({ limit: 1 });

  if (usersLoad || companiesLoad || rfqsLoad || kycLoad) {
    return <DashboardSkeleton />;
  }

  const totalUsers = usersData?.total ?? 0;
  const totalCompanies = companiesData?.total ?? 0;
  const activeRfqs = rfqsData?.total ?? 0;
  const pendingKyc = kycData?.total ?? 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Admin Dashboard"
        description="Platform overview"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={String(totalUsers)} change="Registered" changeType="neutral" />
        <StatCard icon={Building2} label="Total Companies" value={String(totalCompanies)} change="Registered" changeType="neutral" />
        <StatCard icon={FileText} label="Active RFQs" value={String(activeRfqs)} change="Total" changeType="neutral" />
        <StatCard icon={ShieldCheck} label="Pending KYC" value={String(pendingKyc)} change="Awaiting review" changeType="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Quick Links</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Frequently used admin sections</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary/50 p-4 transition-colors hover:bg-surface-secondary dark:border-dark-border dark:bg-dark-surface-secondary/50 dark:hover:bg-dark-surface-secondary"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{link.label}</p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Platform Summary</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Snapshot of platform activity</p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Total Users</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Across all roles</p>
                </div>
              </div>
              <p className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{totalUsers}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Total Companies</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Registered businesses</p>
                </div>
              </div>
              <p className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{totalCompanies}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Active RFQs</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Open requests for quotes</p>
                </div>
              </div>
              <p className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{activeRfqs}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Pending KYC</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Awaiting verification</p>
                </div>
              </div>
              <p className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{pendingKyc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
