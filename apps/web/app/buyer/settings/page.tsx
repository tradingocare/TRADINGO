'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Bell, Shield, Sun, Save, Loader2, BadgeCheck, Mail, Phone, ShieldCheck, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';

export default function BuyerSettingsPage() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user?.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/me', { name, phone });
      toast({ title: 'Profile updated' });
      refreshUser();
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: 'Fill in both password fields', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast({ title: 'Password changed' });
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      toast({ title: 'Failed to change password', variant: 'destructive' });
    }
    finally { setChangingPassword(false); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Settings" description="Manage your account settings" />

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
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Email</label>
              <Input value={email} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Account Verification</CardTitle>
              <CardDescription>Verify your identity to access all features</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Email</p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>
              </div>
              {user?.emailVerifiedAt ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                  <BadgeCheck size={14} /> Verified
                </span>
              ) : (
                <Link href="/verify-email" className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline">
                  Verify now <ArrowUpRight size={12} />
                </Link>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Mobile</p>
                  <p className="text-xs text-text-secondary">{user?.phone || 'Not set'}</p>
                </div>
              </div>
              {user?.phone ? (
                <Link href="/verify-mobile" className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline">
                  Verify <ArrowUpRight size={12} />
                </Link>
              ) : (
                <span className="text-xs text-text-tertiary">Add phone to verify</span>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">KYC Verification Level</p>
                  <p className="text-xs text-text-secondary">Identity verification status</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
                {user?.verificationLevel || 'LEVEL_0'}
              </span>
            </div>
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
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">New Password</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
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
