import { cn } from '@/lib/utils';
import { Breadcrumbs } from './breadcrumbs';

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardPageHeader({ title, description, actions, className }: DashboardPageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <Breadcrumbs className="mb-2" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
