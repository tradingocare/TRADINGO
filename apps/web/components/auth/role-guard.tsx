'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    const stored = localStorage.getItem('userRole');
    if (!stored) {
      router.push('/login');
      return;
    }
    if (allowedRoles.includes(stored)) {
      setStatus('granted');
    } else {
      setStatus('denied');
    }
  }, [allowedRoles, router]);

  if (status === 'loading') {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  }

  if (status === 'denied') {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Access Denied</h2>
        <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
