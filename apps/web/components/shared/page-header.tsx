import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <section className={cn('border-b border-border bg-surface-secondary/50 px-4 pb-12 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border', className)}>
      <div className="container-main">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl dark:text-dark-text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-lg text-text-secondary dark:text-dark-text-secondary">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
