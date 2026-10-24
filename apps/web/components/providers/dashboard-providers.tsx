'use client';

/**
 * DashboardProviders — route-scoped client providers for authenticated dashboard layouts.
 *
 * Wave B (C1+C2) — 2026-09-05:
 * These providers were previously mounted globally in components/providers/providers.tsx,
 * which shipped socket.io-client and realtime/session infrastructure into the initial
 * client bundle of every public/anonymous page. Investigation
 * (docs/reports/TRADINGO-P1-PERFORMANCE-WAVE-B-INVESTIGATION.md) established:
 *   - NotificationProvider's only consumer is the dashboard Topbar (admin/buyer/seller layouts)
 *   - usePresence/useTyping/useChatContext have zero consumers anywhere (dead — removed)
 *   - SocketProvider is required only by NotificationProvider's realtime subscriptions
 *   - SessionTimeoutProvider acts only for authenticated sessions
 * Founder decision: RETAIN realtime/socket + notification + session-timeout on dashboard
 * routes; remove global/public exposure.
 */
import type { ReactNode } from 'react';
import { SocketProvider } from './socket-provider';
import { NotificationProvider } from './notification-provider';
import { SessionTimeoutProvider } from '@/components/auth/session-timeout-provider';

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <SocketProvider>
      <NotificationProvider>
        <SessionTimeoutProvider>
          {children}
        </SessionTimeoutProvider>
      </NotificationProvider>
    </SocketProvider>
  );
}
