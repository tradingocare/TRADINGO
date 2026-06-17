'use client';

import { MapPin } from 'lucide-react';

export function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary animate-pulse">
      <div className="text-center">
        <MapPin className="mx-auto h-10 w-10 text-text-tertiary dark:text-dark-text-tertiary" />
        <p className="mt-3 text-sm text-text-tertiary dark:text-dark-text-tertiary">Loading map...</p>
      </div>
    </div>
  );
}
