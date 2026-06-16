import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  active: 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  completed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  draft: 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary dark:text-dark-text-secondary',
  verified: 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  approved: 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
  submitted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  open: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  disputed: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  resolved: 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
  bug: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  feature: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  nps: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  general: 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary dark:text-dark-text-secondary',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}
