'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, id, ...props }, ref) => {
  const inputId = id || `checkbox-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2.5 group">
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          id={inputId}
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-md border border-border bg-surface transition-all duration-200 group-hover:border-border peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className,
          )}
        >
          <Check className="h-3.5 w-3.5 text-btn-primary-text opacity-0 transition-opacity duration-200 peer-checked:opacity-100" />
        </div>
      </div>
      {label && <span className="text-sm text-text-primary select-none">{label}</span>}
    </label>
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
