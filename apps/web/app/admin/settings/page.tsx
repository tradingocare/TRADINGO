'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/use-toast'
import { Globe, Shield, Save, Loader2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get<{ data: Record<string, unknown> }>('/admin/settings');
      const data = res.data;
      const flat: Record<string, string> = {};
      for (const key of Object.keys(data)) {
        const v = data[key];
        flat[key] = typeof v === 'string' ? v : JSON.stringify(v);
      }
      setSettings(flat);
    } catch {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings() }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch('/admin/settings', settings);
      toast({ title: 'Saved', description: 'Settings updated successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <PageHeader title="Settings" description="Configure platform settings and preferences." />
          <div className="mt-8 flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Settings" description="Configure platform settings and preferences." />

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-5 w-5 text-accent" /> General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Platform Name</label>
                  <Input value={settings.platform_name || 'TRADINGO'} onChange={(e) => setSettings(p => ({ ...p, platform_name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Support Email</label>
                  <Input value={settings.support_email || 'support@tradingo.com'} onChange={(e) => setSettings(p => ({ ...p, support_email: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Default Currency</label>
                  <Input value={settings.default_currency || 'INR'} onChange={(e) => setSettings(p => ({ ...p, default_currency: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Timezone</label>
                  <Input value={settings.timezone || 'Asia/Kolkata'} onChange={(e) => setSettings(p => ({ ...p, timezone: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-accent" /> Platform Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Commission Rate (%)</label>
                  <Input value={settings.commission_rate || '2.5'} onChange={(e) => setSettings(p => ({ ...p, commission_rate: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Max File Upload Size (MB)</label>
                  <Input value={settings.max_upload_size || '100'} onChange={(e) => setSettings(p => ({ ...p, max_upload_size: e.target.value }))} />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
