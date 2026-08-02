import { PackageOpen, AlertTriangle, type LucideIcon } from 'lucide-react';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  variant?: 'empty' | 'loading' | 'error';
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  errorId?: string;
  className?: string;
}

const iconMap = {
  empty: PackageOpen,
  error: AlertTriangle,
};

export function EmptyState({
  variant = 'empty',
  icon,
  title,
  description,
  action,
  errorId,
  className,
}: EmptyStateProps) {
  if (variant === 'loading') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <LoadingSpinner size="lg" color="accent" />
        <h3 className="mt-4 text-lg font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
        )}
      </div>
    );
  }

  const Icon = icon || iconMap[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
          variant === 'error' ? 'bg-status-error/10' : 'bg-surface',
        )}
      >
        <Icon
          className={cn(
            'h-8 w-8',
            variant === 'error' ? 'text-status-error' : 'text-text-tertiary',
          )}
        />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
      )}
      {errorId && (
        <p className="mt-2 font-mono text-[11px] text-text-tertiary">{errorId}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
