'use client';

import { useState } from 'react';
import { DashboardPageHeader, DashboardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api/client';
import { User, Bell, Shield, Moon, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SellerSettingsPage() {
  const user = useAuthStore((s: any) => s.user);
  const companyId = user?.companyId || '';
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({ name: '', phone: '', gst: '', type: '', address: '' });
  const [password, setPassword] = useState({ current: '', newPwd: '' });
  const [notifications, setNotifications] = useState({ orders: true, rfq: true, payments: true, digest: true });

  useState(() => {
    if (!companyId) {
      setLoadingCompany(false);
      return;
    }
    apiClient.get('/companies/my-company')
      .then((res: any) => {
        const c = res.data?.data || res.data;
        setCompany(c);
        setProfile({ name: c.name || '', phone: c.phone || '', gst: c.gst || '', type: c.type || '', address: [c.address, c.city, c.state].filter(Boolean).join(', ') });
      })
      .catch(() => toast({ title: 'Failed to load settings', variant: 'destructive' }))
      .finally(() => setLoadingCompany(false));
  });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiClient.patch('/companies/my-company', profile);
      toast({ title: 'Profile updated successfully' });
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password.current || !password.newPwd) {
      toast({ title: 'Please fill in both password fields', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword: password.current, newPassword: password.newPwd });
      toast({ title: 'Password updated successfully' });
      setPassword({ current: '', newPwd: '' });
    } catch {
      toast({ title: 'Failed to update password', variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingCompany) return <DashboardSkeleton />;

  if (!company) {
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
      <DashboardPageHeader title="Settings" description="Manage your account and preferences" />

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
              <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Phone</label>
              <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">GSTIN</label>
              <Input value={profile.gst} onChange={(e) => setProfile((p) => ({ ...p, gst: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Business Type</label>
              <Input value={profile.type} onChange={(e) => setProfile((p) => ({ ...p, type: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Address</label>
              <Input value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
              {savingProfile ? 'Saving...' : 'Save Changes'}
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
              { key: 'orders', label: 'New Order Notifications', desc: 'Get notified when you receive a new order' },
              { key: 'rfq', label: 'RFQ Alerts', desc: 'Receive alerts for new RFQs matching your products' },
              { key: 'payments', label: 'Payment Confirmations', desc: 'Get notified when payments are processed' },
              { key: 'digest', label: 'Weekly Digest', desc: 'Receive a weekly summary of your store activity' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" checked={notifications[item.key as keyof typeof notifications]} onChange={() => setNotifications((n) => {
                    const updated = { ...n, [item.key]: !n[item.key as keyof typeof notifications] };
                    apiClient.patch('/auth/me', { notifications: updated }).catch(() => toast({ title: 'Failed to update notification preferences', variant: 'destructive' }));
                    return updated;
                  })} />
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
              <Input type="password" placeholder="Enter current password" value={password.current} onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">New Password</label>
              <Input type="password" placeholder="Enter new password" value={password.newPwd} onChange={(e) => setPassword((p) => ({ ...p, newPwd: e.target.value }))} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline" onClick={handleUpdatePassword} disabled={savingPassword}>
              {savingPassword ? <LoadingSpinner size="sm" /> : null}
              {savingPassword ? 'Updating...' : 'Update Password'}
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
              <input type="checkbox" className="peer sr-only" checked={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')} onChange={() => {
                if (typeof document !== 'undefined') {
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                }
              }} />
              <div className="h-6 w-11 rounded-full bg-surface-tertiary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
