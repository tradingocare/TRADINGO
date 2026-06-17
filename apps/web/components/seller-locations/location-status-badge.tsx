import { MapPin, MapPinOff } from 'lucide-react';

interface LocationStatusBadgeProps {
  locationSet: boolean;
  indexed?: boolean;
}

export function LocationStatusBadge({ locationSet, indexed }: LocationStatusBadgeProps) {
  if (!locationSet) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <MapPinOff className="h-3 w-3" />
        Not Set
      </span>
    );
  }

  if (indexed === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
        <MapPin className="h-3 w-3" />
        Pending Sync
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
      <MapPin className="h-3 w-3" />
      Set
    </span>
  );
}
