import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressTrackVariants = cva(
  'w-full overflow-hidden rounded-full bg-surface-tertiary',
  {
    variants: {
      size: {
        sm: 'h-1',
        default: 'h-1.5',
        lg: 'h-2',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const progressBarVariants = cva('h-full rounded-full transition-all duration-500 ease-out', {
  variants: {
    variant: {
      default: 'bg-accent',
      success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      warning: 'bg-gradient-to-r from-amber-500 to-amber-400',
      danger: 'bg-gradient-to-r from-red-500 to-red-400',
      info: 'bg-gradient-to-r from-blue-500 to-blue-400',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface ProgressProps extends VariantProps<typeof progressTrackVariants>, VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, size, variant, className, showLabel }, ref) => {
    const pct = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div ref={ref} className={cn(progressTrackVariants({ size }))} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
          <div
            className={cn(progressBarVariants({ variant }))}
            style={{ width: `${pct}%` }}
          />
        </div>
        {showLabel && <span className="shrink-0 text-xs text-text-secondary tabular-nums">{Math.round(pct)}%</span>}
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
