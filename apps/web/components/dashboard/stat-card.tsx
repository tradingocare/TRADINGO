import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export function StatCard({ icon: Icon, label, value, change, changeType = 'neutral', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-dark-surface dark:border-dark-border',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              changeType === 'positive' && 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
              changeType === 'negative' && 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
              changeType === 'neutral' && 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary',
            )}
          >
            {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-text-primary dark:text-dark-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{label}</p>
    </div>
  );
}
