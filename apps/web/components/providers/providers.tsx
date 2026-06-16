import { QueryProvider } from '@/lib/query/provider';
import { ThemeProviderWrapper } from '@/components/shared/theme-wrapper';
import { SocketProvider } from './socket-provider';
import { PresenceProvider } from './presence-provider';
import { TypingProvider } from './typing-provider';
import { ChatProvider } from './chat-provider';
import { NotificationProvider } from './notification-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <QueryProvider>
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
      </QueryProvider>
    </ThemeProviderWrapper>
  );
}
