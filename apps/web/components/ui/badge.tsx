import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-500/10 text-primary-700',
        secondary: 'border-transparent bg-surface-secondary text-text-secondary',
        destructive: 'border-transparent bg-red-500/10 text-red-700',
        outline: 'text-text-primary',
        success: 'border-transparent bg-accent-500/10 text-accent-700',
        warning: 'border-transparent bg-amber-500/10 text-amber-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
