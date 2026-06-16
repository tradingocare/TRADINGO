import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CTAProps {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: 'default' | 'accent' | 'simple';
  className?: string;
}

export function CTABlock({
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = 'default',
  className,
}: CTAProps) {
  return (
    <section
      className={cn(
        'py-20',
        variant === 'accent' && 'bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900',
        variant === 'default' && 'bg-surface-secondary dark:bg-dark-surface-secondary',
        variant === 'simple' && 'bg-surface dark:bg-dark-surface',
        className,
      )}
    >
      <div className="container-main">
        <div
          className={cn(
            'mx-auto max-w-3xl text-center',
            variant === 'accent' ? 'text-white' : '',
          )}
        >
          <h2
            className={cn(
              'text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl',
              variant === 'accent' ? 'text-white' : 'text-text-primary dark:text-dark-text-primary',
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={cn(
                'mx-auto mt-4 max-w-2xl text-lg',
                variant === 'accent' ? 'text-primary-100' : 'text-text-secondary dark:text-dark-text-secondary',
              )}
            >
              {subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={primaryHref}>
              <Button
                size="xl"
                variant={variant === 'accent' ? 'secondary' : 'default'}
                className={cn(
                  'w-full sm:w-auto',
                  variant === 'accent' && 'bg-white text-primary-700 hover:bg-primary-50',
                )}
              >
                {primaryLabel}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link href={secondaryHref}>
                <Button
                  size="xl"
                  variant={variant === 'accent' ? 'ghost' : 'outline'}
                  className={cn(
                    'w-full sm:w-auto',
                    variant === 'accent' && 'text-white hover:bg-white/10',
                  )}
                >
                  {secondaryLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
