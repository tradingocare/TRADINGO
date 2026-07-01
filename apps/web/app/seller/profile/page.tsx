'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader, StatusBadge, DashboardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api/client';
import { Building2, Phone, MapPin, BadgeIndianRupee, Globe } from 'lucide-react';
import type { Company } from '@/lib/api/types';

export default function SellerProfilePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/companies/my-company')
      .then(res => setCompany(res.data?.data || res.data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !company) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Profile" description="Manage your seller profile" />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load company profile. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const companyFields = [
    { label: 'Company Name', value: company.name, icon: Building2 },
    { label: 'Phone', value: company.phone || '—', icon: Phone },
    { label: 'GSTIN', value: company.gst || '—', icon: BadgeIndianRupee },
    { label: 'Address', value: [company.address, company.city, company.state].filter(Boolean).join(', ') || '—', icon: MapPin },
    { label: 'Business Type', value: company.type, icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Profile"
        description="Manage your seller profile"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Company Information</CardTitle>
            <StatusBadge status={company.verificationStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {companyFields.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{item.label}</p>
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification & Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Account Status</p>
              <p className="mt-1 text-sm font-medium capitalize text-text-primary dark:text-dark-text-primary">{company.status}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Verification Status</p>
              <div className="mt-1">
                <StatusBadge status={company.verificationStatus} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Member Since</p>
              <p className="mt-1 text-sm font-medium text-text-primary dark:text-dark-text-primary">{new Date(company.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
