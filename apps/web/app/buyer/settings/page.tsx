'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, Sun, Save, BadgeCheck, Mail, Phone, ShieldCheck, ArrowUpRight } from 'lucide-react';
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
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    'Quote Received': true, 'Order Updates': true, 'Payment Confirmations': true, 'GOCASH Rewards': true, 'Promotional Emails': false,
  });

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
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
              <label className="text-sm font-medium text-text-primary">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Email</label>
              <Input value={email} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-success/10 text-status-success">
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
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Email</p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>
              </div>
              {user?.emailVerifiedAt ? (
                <span className="flex items-center gap-1 text-xs font-medium text-status-success">
                  <BadgeCheck size={14} /> Verified
                </span>
              ) : (
                <Link href="/verify-email" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                  Verify now <ArrowUpRight size={12} />
                </Link>
              )}
            </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Mobile</p>
                  <p className="text-xs text-text-secondary">{user?.phone || 'Not set'}</p>
                </div>
              </div>
              {user?.phone ? (
                <Link href="/verify-mobile" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                  Verify <ArrowUpRight size={12} />
                </Link>
              ) : (
                <span className="text-xs text-text-tertiary">Add phone to verify</span>
              )}
            </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">KYC Verification Level</p>
                  <p className="text-xs text-text-secondary">Identity verification status</p>
                </div>
              </div>
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                {user?.verificationLevel || 'LEVEL_0'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
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
            {Object.keys(notifPrefs).map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{item}</span>
                <Switch checked={notifPrefs[item]} onChange={(e) => {
                  const updated = { ...notifPrefs, [item]: e.target.checked };
                  setNotifPrefs(updated);
                  api.patch('/auth/me', { preferences: { notifications: updated } }).catch(() => toast({ title: 'Failed to update preferences', variant: 'destructive' }));
                }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
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
                <label className="text-sm font-medium text-text-primary">Current Password</label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">New Password</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Update Password
            </Button>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                <p className="text-xs text-text-secondary">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast({ title: '2FA setup', description: 'Contact support to enable two-factor authentication' })}>Enable</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
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
                onClick={() => {
                  if (typeof document !== 'undefined') {
                    if (theme === 'Light') { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
                    else if (theme === 'Dark') { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
                    else { localStorage.removeItem('theme'); document.documentElement.classList.remove('dark'); }
                  }
                  toast({ title: `Theme set to ${theme}` });
                }}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
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
