import { QueryProvider } from '@/lib/query/provider';
import { ThemeProviderWrapper } from '@/components/shared/theme-wrapper';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AuthStoreHydrator } from '@/components/auth/auth-store-hydrator';

/**
 * Global providers — mounted once in app/layout.tsx for ALL routes.
 *
 * Wave B (C1+C2) — 2026-09-05:
 * SocketProvider, PresenceProvider, TypingProvider, ChatProvider,
 * NotificationProvider and SessionTimeoutProvider were removed from this
 * global tree and scoped to authenticated dashboard layouts via
 * components/providers/dashboard-providers.tsx (admin/buyer/seller layouts).
 * PresenceProvider, TypingProvider and ChatProvider had zero consumers
 * anywhere and were deleted (see Wave B completion report for evidence).
 *
 * P0 providers that must stay global (per Wave B investigation):
 *   - ThemeProviderWrapper  (theme toggle on every page)
 *   - QueryProvider        (React Query used by public catalog/search pages)
 *   - AuthProvider         (global auth-core; do not consolidate — C3 out of scope)
 *   - AuthStoreHydrator    (zustand auth store hydration; C3 out of scope)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <QueryProvider>
        <AuthProvider>
          <AuthStoreHydrator />
          {children}
        </AuthProvider>
      </QueryProvider>
    </ThemeProviderWrapper>
  );
}
