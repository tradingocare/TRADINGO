'use client';

import Link from 'next/link';
import { Bell, CheckCheck, X, MailOpen, ShoppingCart, FileText, CreditCard, AlertTriangle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/api/types';

interface NotificationDrawerProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  order: <ShoppingCart className="h-4 w-4" />,
  rfq: <FileText className="h-4 w-4" />,
  quote: <FileText className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  kyc: <AlertTriangle className="h-4 w-4" />,
  system: <Award className="h-4 w-4" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDrawer({ notifications, unreadCount, onMarkRead, onMarkAllRead, isOpen, onClose }: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-border bg-surface shadow-2xl animate-slide-down dark:bg-dark-surface dark:border-dark-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1 text-text-tertiary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Bell className="h-8 w-8 text-text-tertiary" />
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 dark:border-dark-border',
                  !n.read && 'bg-primary-50/50 dark:bg-primary-900/10',
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  !n.read ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-surface-secondary text-text-tertiary dark:bg-dark-surface-secondary',
                )}>
                  {typeIcons[n.type] || <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{n.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary line-clamp-2">{n.message}</p>
                  <p className="mt-1 text-[10px] text-text-tertiary dark:text-dark-text-tertiary">{timeAgo(n.createdAt)}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {!n.read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="rounded-lg p-1 text-text-tertiary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
                      title="Mark as read"
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {n.link && (
                    <Link href={n.link} className="rounded-lg p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
