'use client';

import Link from 'next/link';
import { FileQuestion, Home, LayoutDashboard, Search } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NotFoundStateProps {
  title?: string;
  message?: string;
  showHome?: boolean;
  showDashboard?: boolean;
  showSearch?: boolean;
  dashboardHref?: string;
  searchHref?: string;
  className?: string;
}

export function NotFoundState({
  title = 'Page not found',
  message = 'The page you are looking for does not exist or has been moved.',
  showHome = true,
  showDashboard = false,
  showSearch = false,
  dashboardHref = '/seller/dashboard',
  searchHref = '/search',
  className,
}: NotFoundStateProps) {
  return (
    <div className={cn('flex min-h-[60vh] items-center justify-center p-4', className)}>
      <Card className="mx-auto w-full max-w-md text-center">
        <div className="p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <FileQuestion className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-text-primary dark:text-dark-text-primary">
            {title}
          </h1>

          <p className="mb-6 text-sm text-text-secondary dark:text-dark-text-secondary">
            {message}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
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

            {showSearch && (
              <Link href={searchHref} className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}>
                <Search className="h-4 w-4" aria-hidden="true" />
                Browse Products
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
