'use client';

import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface DistanceBadgeProps {
  distanceKm: number;
  distanceLabel: string;
  className?: string;
}

export function DistanceBadge({ distanceKm, distanceLabel, className }: DistanceBadgeProps) {
  const isNearby = distanceKm <= 25;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isNearby
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        className,
      )}
    >
      <MapPin className="h-3 w-3" />
      {distanceLabel}
    </span>
  );
}
