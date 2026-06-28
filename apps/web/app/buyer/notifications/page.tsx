'use client';

import { useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useBuyerNotifications, useMarkBuyerNotificationRead, useMarkAllBuyerNotificationsRead } from '@/hooks';
import { Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';

const typeIcons: Record<string, string> = {
  RFQ_RESPONSE: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  ORDER_UPDATE: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  PAYMENT: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  SYSTEM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function BuyerNotificationsPage() {
  const [type, setType] = useState<string | undefined>();
  const { data, isLoading } = useBuyerNotifications(type);
  const markRead = useMarkBuyerNotificationRead();
  const markAllRead = useMarkAllBuyerNotificationsRead();

  const notifications = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardPageHeader title="Notifications" description="Stay updated on your procurement activity" />
        {notifications.some((n: any) => !n.readAt) && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {['', 'RFQ_RESPONSE', 'ORDER_UPDATE', 'PAYMENT', 'SYSTEM'].map((t) => (
          <Button key={t} variant={type === t ? 'default' : 'outline'} size="sm" onClick={() => setType(t || undefined)}>
            {t || 'All'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-text-tertiary" /></div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Bell className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No notifications</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <div key={notif.id}
              className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${notif.readAt ? 'border-border bg-surface dark:bg-dark-surface dark:border-dark-border' : 'border-[#FF5A1F]/20 bg-[#FF5A1F]/5 dark:bg-[#FF5A1F]/10'}`}>
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${typeIcons[notif.type] ?? 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{notif.title}</p>
                  <span className="flex-shrink-0 text-[10px] text-text-tertiary">{new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">{notif.body}</p>
                {!notif.readAt && (
                  <Button variant="ghost" size="sm" className="mt-2 h-auto px-2 py-1 text-[11px] text-[#FF5A1F]" onClick={() => markRead.mutate(notif.id)}>
                    <CheckCheck className="h-3 w-3 mr-1" /> Mark Read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
