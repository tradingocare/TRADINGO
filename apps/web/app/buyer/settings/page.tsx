'use client';

import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Bell, Shield, Sun, Save } from 'lucide-react';

export default function BuyerSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Manage your account settings"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Full Name</label>
              <Input defaultValue="Rahul Sharma" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Email</label>
              <Input defaultValue="rahul@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Phone</label>
              <Input defaultValue="+91 98765 43210" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Company</label>
              <Input defaultValue="ABC Traders Pvt. Ltd." />
            </div>
          </div>
          <div className="mt-4">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure your notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Quote Received', 'Order Updates', 'Payment Confirmations', 'GOCASH Rewards', 'Promotional Emails'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm text-text-primary dark:text-dark-text-primary">{item}</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-surface-tertiary after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-surface after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-dark-surface-tertiary" />
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Current Password</label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">New Password</label>
                <Input type="password" />
              </div>
            </div>
            <Button size="sm">Update Password</Button>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Two-Factor Authentication</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>Customize your dashboard appearance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {['Light', 'Dark', 'System'].map((theme) => (
              <button
                key={theme}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary dark:border-dark-border dark:hover:bg-dark-surface-secondary"
              >
                {theme}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
