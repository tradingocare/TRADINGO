'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
        <WifiOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">You&apos;re Offline</h1>
      <p className="mx-auto mt-3 max-w-md text-text-secondary dark:text-dark-text-secondary">
        Please check your internet connection and try again. Some features may be limited while offline.
      </p>
      <div className="mt-8 flex gap-4">
        <Button onClick={() => window.location.reload()} variant="default">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
