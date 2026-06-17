'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function NearMeSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
          <Skeleton className="h-24 w-24 flex-shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}
