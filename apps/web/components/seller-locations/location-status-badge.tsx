import { MapPin, MapPinOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LocationStatusBadgeProps {
  locationSet: boolean;
  indexed?: boolean;
}

export function LocationStatusBadge({ locationSet, indexed }: LocationStatusBadgeProps) {
  if (!locationSet) {
    return (
      <Badge variant="warning" className="gap-1">
        <MapPinOff className="h-3 w-3" />
        Not Set
      </Badge>
    );
  }

  if (indexed === false) {
    return (
      <Badge variant="default" className="gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
        <MapPin className="h-3 w-3" />
        Pending Sync
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="gap-1">
      <MapPin className="h-3 w-3" />
      Set
    </Badge>
  );
}
