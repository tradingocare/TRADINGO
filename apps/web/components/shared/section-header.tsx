import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewMoreHref?: string;
  viewMoreLabel?: string;
  className?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  title,
  subtitle,
  viewMoreHref,
  viewMoreLabel = 'View More',
  className,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-12 space-y-4',
        align === 'center' && 'text-center',
        className,
      )}
    >
      <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto max-w-2xl text-lg text-text-tertiary">
          {subtitle}
        </p>
      )}
      {viewMoreHref && (
        <div className={cn('pt-2', align === 'center' && 'text-center')}>
          <Link
            href={viewMoreHref}
            className="group inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent"
          >
            {viewMoreLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
