import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const selectVariants = cva(
  'flex w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary ring-offset-surface placeholder:text-text-tertiary transition-colors duration-200 focus:border-accent-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
  {
    variants: {
      size: {
        default: 'h-10',
        sm: 'h-9 rounded-lg px-2 text-xs',
        lg: 'h-12 rounded-xl px-4 text-base',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, size: _size, children, ...props }, ref) => {
  const size = _size || 'default';
  return (
    <div className="relative">
      <select className={cn(selectVariants({ size, className }))} ref={ref} {...props}>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-4 w-4 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
});
Select.displayName = 'Select';

export { Select, selectVariants };
