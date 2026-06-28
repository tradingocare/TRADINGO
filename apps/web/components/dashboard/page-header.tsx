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
      <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-white/60">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
