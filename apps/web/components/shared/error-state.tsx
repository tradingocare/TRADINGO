'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { captureError } from '@/lib/monitoring/sentry';

interface ErrorStateProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  message?: string;
  showHome?: boolean;
  showDashboard?: boolean;
  dashboardHref?: string;
  className?: string;
}

function generateErrorId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `ERR-${ts}-${rand}`;
}

export function ErrorState({
  error,
  reset,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showHome = true,
  showDashboard = false,
  dashboardHref = '/seller/dashboard',
  className,
}: ErrorStateProps) {
  const displayId = error?.digest ?? generateErrorId();

  useEffect(() => {
    if (error) {
      captureError(error, { digest: error.digest, boundary: 'ErrorState' });
    }
  }, [error]);

  const handleRetry = useCallback(() => {
    reset?.();
  }, [reset]);

  return (
    <div className={cn('flex min-h-[60vh] items-center justify-center p-4', className)}>
      <Card className="mx-auto w-full max-w-md text-center">
        <div className="p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-text-primary dark:text-dark-text-primary">
            {title}
          </h1>

          <p className="mb-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            {message}
          </p>

          {displayId && (
            <p className="mb-6 font-mono text-xs text-text-tertiary dark:text-dark-text-tertiary">
              Error ID: <span className="font-semibold">{displayId}</span>
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {reset && (
              <Button variant="default" onClick={handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            )}

            {showHome && (
              <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </Link>
            )}

            {showDashboard && (
              <Link href={dashboardHref} className={cn(buttonVariants({ variant: 'secondary' }), 'gap-2')}>
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
