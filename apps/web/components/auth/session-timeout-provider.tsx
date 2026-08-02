'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { clearTokens } from '@/lib/auth';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    timerRef.current = null;
    warningRef.current = null;
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    timerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            clearTokens();
            localStorage.removeItem('userRole');
            localStorage.removeItem('rememberMe');
            document.cookie = 'userRole=; path=/; max-age=0';
            router.push('/login');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      warningRef.current = interval as unknown as ReturnType<typeof setTimeout>;
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
  }, [clearTimers, router]);

  const handleActivity = useCallback(() => {
    if (isAuthenticated) resetTimers();
  }, [isAuthenticated, resetTimers]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setShowWarning(false);
      return;
    }
    resetTimers();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, handleActivity));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimers();
    };
  }, [isAuthenticated, handleActivity, clearTimers, resetTimers]);

  const stayLoggedIn = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    resetTimers();
  }, [clearTimers, resetTimers]);

  if (!showWarning) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-surface-secondary p-6 text-center shadow-2xl dark:bg-dark-surface-secondary">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/20">
            <span className="text-2xl">&#9200;</span>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Session Expiring</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your session will expire due to inactivity in <span className="font-semibold text-accent-500">{countdown}s</span>.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={stayLoggedIn}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-primary-700"
            >
              Stay Logged In
            </button>
            <button
              onClick={() => {
                clearTimers();
                clearTokens();
                localStorage.removeItem('userRole');
                document.cookie = 'userRole=; path=/; max-age=0';
                router.push('/login');
              }}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
