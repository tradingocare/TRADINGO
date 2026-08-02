'use client';

import { Bell, MessageSquare, AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useNotifications, useUnreadCount, useMarkAllAsRead } from '@/hooks/use-notifications';

export function EcosystemNotificationsCard() {
  const { data: notifications, isLoading } = useNotifications({ limit: 5 });
  const { data: unreadCount } = useUnreadCount();
  const markAllMutation = useMarkAllAsRead();

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Alerts</h3>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-500">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <Bell className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded bg-surface-secondary" />
          ))}
        </div>
      ) : notifications && notifications.data.length > 0 ? (
        <div className="space-y-2">
          {notifications.data.slice(0, 4).map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                n.read ? 'bg-surface/50' : 'bg-surface'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'system' && <Bell className="h-4 w-4 text-accent" />}
                {n.type === 'order' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                {n.type === 'payment' && <Info className="h-4 w-4 text-blue-500" />}
                {n.type === 'kyc' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {!['system', 'order', 'payment', 'kyc'].includes(n.type) && (
                  <MessageSquare className="h-4 w-4 text-text-tertiary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs ${n.read ? 'text-text-tertiary' : 'text-text-primary font-medium'}`}>
                  {n.title}
                </p>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}

          {unreadCount !== undefined && unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllMutation.mutate()}
              className="w-full rounded-lg bg-surface py-2 text-center text-xs font-medium text-[#f59e0b] transition-colors hover:bg-surface-secondary"
            >
              Mark all as read
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4">
          <Bell className="h-8 w-8 text-text-tertiary/50" />
          <p className="text-xs text-text-tertiary">No recent notifications</p>
        </div>
      )}
    </GlassCard>
  );
}
