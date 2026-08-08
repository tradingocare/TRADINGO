import { QueryProvider } from '@/lib/query/provider';
import { ThemeProviderWrapper } from '@/components/shared/theme-wrapper';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AuthStoreHydrator } from '@/components/auth/auth-store-hydrator';
import { SessionTimeoutProvider } from '@/components/auth/session-timeout-provider';
import { SocketProvider } from './socket-provider';
import { PresenceProvider } from './presence-provider';
import { TypingProvider } from './typing-provider';
import { ChatProvider } from './chat-provider';
import { NotificationProvider } from './notification-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <QueryProvider>
        <AuthProvider>
          <AuthStoreHydrator />
          <SessionTimeoutProvider>
            <SocketProvider>
              <PresenceProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <TypingProvider>
                      {children}
                    </TypingProvider>
                  </ChatProvider>
                </NotificationProvider>
              </PresenceProvider>
            </SocketProvider>
          </SessionTimeoutProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProviderWrapper>
  );
}
