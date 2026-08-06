'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Lock, Globe, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { useSettings, useUpdateSettings } from '@/hooks/use-tradeserv';
import { useSaveToast } from '@/hooks/use-save-toast';
import { SaveToast } from '@/components/tradeserv/save-toast';

interface SettingsSection {
  icon: React.ElementType;
  title: string;
  desc: string;
  key: 'notifications' | 'privacy' | 'visibility' | 'communication';
  items: { label: string; field: string }[];
}

const SECTIONS: SettingsSection[] = [
  {
    icon: Bell, title: 'Notifications', desc: 'Manage email and in-app notification preferences',
    key: 'notifications',
    items: [
      { label: 'New inquiry alerts', field: 'emailAlerts' },
      { label: 'Profile view notifications', field: 'smsAlerts' },
      { label: 'Weekly analytics digest', field: 'digestEnabled' },
    ],
  },
  {
    icon: Lock, title: 'Privacy', desc: 'Control who can see your profile and contact you',
    key: 'privacy',
    items: [
      { label: 'Show email on profile', field: 'showEmail' },
      { label: 'Show phone on profile', field: 'showPhone' },
      { label: 'Allow direct messages', field: 'allowMessages' },
    ],
  },
  {
    icon: Globe, title: 'Profile Visibility', desc: 'Manage your public profile settings',
    key: 'visibility',
    items: [
      { label: 'Visible in search results', field: 'searchVisible' },
      { label: 'Show in category listings', field: 'categoryVisible' },
      { label: 'Featured professional', field: 'featured' },
    ],
  },
  {
    icon: Mail, title: 'Communication', desc: 'Set your communication preferences',
    key: 'communication',
    items: [
      { label: 'Weekly analytics digest', field: 'weeklyDigest' },
      { label: 'Membership renewal reminders', field: 'renewalReminders' },
      { label: 'Platform updates', field: 'platformUpdates' },
    ],
  },
];

export default function SettingsPage() {
  const { data: settings, isLoading, isError } = useSettings();
  const updateSettings = useUpdateSettings();
  const { saved, handleSave: showToast } = useSaveToast();
  const [localSettings, setLocalSettings] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        notifications: { ...settings.notifications },
        privacy: { ...settings.privacy },
        visibility: { ...settings.visibility },
        communication: { ...settings.communication },
      });
    }
  }, [settings]);

  const toggle = (section: string, field: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: !prev[section]?.[field] },
    }));
  };

  const handleSaveAll = async () => {
    await updateSettings.mutateAsync(localSettings);
    showToast();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-text-secondary">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Manage your workspace preferences"
      />
      <div className="grid gap-6">
        {SECTIONS.map(({ icon: Icon, title, desc, key, items }) => (
          <div
            key={title}
            className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-tertiary">{desc}</p>
              </div>
            </div>
            <div className="space-y-3">
              {items.map((item) => {
                const isOn = localSettings[key]?.[item.field] ?? false;
                return (
                  <label key={item.field} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 cursor-pointer">
                    <span className="text-sm text-text-secondary">{item.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      onClick={() => toggle(key, item.field)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${isOn ? 'bg-accent' : 'bg-bg-elevated'}`}
                    >
                      <div className={`h-4 w-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-[18px]' : 'translate-x-0.5'} translate-y-0.5`} />
                    </button>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSaveAll}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
      >
        Save All Settings
      </button>
      <SaveToast show={saved} message="Settings saved successfully" />
    </div>
  );
}
