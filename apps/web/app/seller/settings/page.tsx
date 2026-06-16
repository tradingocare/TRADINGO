'use client';

import { DashboardPageHeader, DashboardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompany } from '@/hooks';
import { User, Bell, Shield, Moon, Save } from 'lucide-react';

export default function SellerSettingsPage() {
  const { data: company, isLoading, error } = useCompany('company-1');

  if (isLoading) return <DashboardSkeleton />;

  if (error || !company) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Settings" description="Manage your account and preferences" />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load settings. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal and business information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Company Name</label>
              <Input defaultValue={company.name} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Phone</label>
              <Input defaultValue={company.phone || ''} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">GSTIN</label>
              <Input defaultValue={company.gst || ''} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Business Type</label>
              <Input defaultValue={company.type} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Address</label>
              <Input defaultValue={[company.address, company.city, company.state].filter(Boolean).join(', ')} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'New Order Notifications', desc: 'Get notified when you receive a new order' },
              { label: 'RFQ Alerts', desc: 'Receive alerts for new RFQs matching your products' },
              { label: 'Payment Confirmations', desc: 'Get notified when payments are processed' },
              { label: 'Weekly Digest', desc: 'Receive a weekly summary of your store activity' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="h-6 w-11 rounded-full bg-surface-tertiary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password and security settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Current Password</label>
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline">
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Toggle between light and dark mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
            <div>
              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Dark Mode</p>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Switch between light and dark appearance</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-surface-tertiary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
