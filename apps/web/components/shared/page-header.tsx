import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden px-4 pb-12 pt-24',
        className,
      )}
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)',
        }}
      />
      <div className="container-main relative z-10">
        <div className="inline-block glass-card-lg px-5 py-3">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-lg text-text-secondary">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
