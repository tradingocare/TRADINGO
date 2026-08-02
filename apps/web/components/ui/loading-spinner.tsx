import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      default: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    color: {
      default: 'text-text-tertiary',
      accent: 'text-accent-600',
      muted: 'text-text-tertiary',
      white: 'text-white',
    },
  },
  defaultVariants: { size: 'default', color: 'accent' },
});

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size, color, text, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn(spinnerVariants({ size, color }))} aria-hidden="true" />
      {text && <p className="text-sm text-text-secondary animate-pulse-soft">{text}</p>}
    </div>
  );
}
