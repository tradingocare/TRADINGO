'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { NotificationDrawer } from '@/components/notifications/notification-drawer';
import { UnreadBadge } from '@/components/notifications/unread-badge';
import { clearTokens } from '@/lib/auth';
import { useNotificationContext } from '@/components/providers/notification-provider';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationContext();

  const handleSignOut = () => {
    clearTokens();
    window.location.href = '/login';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      searchRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 dark:bg-dark-surface/95 dark:border-dark-border">
      <div className="flex items-center gap-3 lg:hidden">
        <TradingoLogo height={32} showText={false} />
      </div>

      {title && (
        <h1 className="hidden text-lg font-semibold text-text-primary sm:block dark:text-dark-text-primary">
          {title}
        </h1>
      )}

      <div className="hidden flex-1 sm:block">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search products, RFQs, orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface-secondary pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-dark-surface-secondary dark:border-dark-border"
          />
        </form>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5">
                <UnreadBadge count={unreadCount} />
              </span>
            )}
          </button>
          <NotificationDrawer
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
              A
            </div>
            <ChevronDown className="hidden h-4 w-4 text-text-secondary sm:block dark:text-dark-text-secondary" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg animate-slide-down dark:bg-dark-surface dark:border-dark-border">
                <div className="border-b border-border px-3 py-2 dark:border-dark-border">
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Admin User</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">admin@tradingo.com</p>
                </div>
                <div className="mt-1 space-y-1">
                  <Link
                    href="/seller/settings"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <Link
                    href="/seller/profile"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
