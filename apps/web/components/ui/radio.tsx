'use client';

import { createContext, useContext, forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({ value, onValueChange, name, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={cn('flex flex-col gap-2', className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  value: string;
  label?: string;
}

const RadioItem = forwardRef<HTMLInputElement, RadioItemProps>(({ value, label, id, className, ...props }, ref) => {
  const ctx = useContext(RadioGroupContext);
  const inputId = id || `radio-${value}`;
  const checked = ctx ? ctx.value === value : undefined;

  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2.5 group">
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="radio"
          id={inputId}
          ref={ref}
          value={value}
          name={ctx?.name}
          checked={checked}
          onChange={() => ctx?.onValueChange(value)}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface transition-all duration-200 group-hover:border-border peer-checked:border-accent-600 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className,
          )}
        >
          <div className="h-2.5 w-2.5 rounded-full bg-accent-600 opacity-0 transition-opacity duration-200 peer-checked:opacity-100" />
        </div>
      </div>
      {label && <span className="text-sm text-text-primary select-none">{label}</span>}
    </label>
  );
});
RadioItem.displayName = 'RadioItem';

export { RadioItem };
