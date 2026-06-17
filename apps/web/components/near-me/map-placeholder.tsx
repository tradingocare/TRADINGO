'use client';

import { MapPin } from 'lucide-react';

export function MapPlaceholder() {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-surface-secondary dark:border-dark-border dark:bg-dark-surface-secondary">
      <div className="text-center">
        <MapPin className="mx-auto h-8 w-8 text-text-tertiary" />
        <p className="mt-2 text-sm text-text-tertiary dark:text-dark-text-tertiary">
          Map view coming soon
        </p>
      </div>
    </div>
  );
}
