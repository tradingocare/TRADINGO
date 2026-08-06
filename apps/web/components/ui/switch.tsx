'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const switchVariants = cva(
  'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface transition-all duration-200 peer-checked:border-accent-600 peer-checked:bg-accent-600 peer-checked:shadow-[0_0_12px_rgba(255,77,0,0.25)] peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface group-hover:border-border peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-6 w-11',
        sm: 'h-5 w-9',
        lg: 'h-7 w-13',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const switchKnobVariants = cva(
  'pointer-events-none absolute left-[2px] top-[2px] rounded-full bg-white shadow-sm transition-all duration-200 peer-checked:translate-x-full',
  {
    variants: {
      size: {
        default: 'h-5 w-5',
        sm: 'h-4 w-4',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof switchVariants> {
  label?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ className, size: _size, label, id, ...props }, ref) => {
  const size = _size || 'default';
  const inputId = id || `switch-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-3 group">
      <div className="relative">
        <input
          type="checkbox"
          role="switch"
          id={inputId}
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div className={cn(switchVariants({ size }), className)}>
          <span className={cn(switchKnobVariants({ size }))} />
        </div>
      </div>
      {label && <span className="text-sm text-text-primary select-none">{label}</span>}
    </label>
  );
});
Switch.displayName = 'Switch';

export { Switch };
