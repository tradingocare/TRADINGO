'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-accent-500 to-accent-400 text-btn-primary-text hover:bg-gradient-to-br hover:from-accent-400 hover:to-accent-500 shadow-sm hover:shadow-md',
        destructive: 'bg-status-error text-btn-primary-text hover:bg-status-error/90 shadow-sm',
        outline: 'border border-border bg-surface hover:bg-surface-secondary hover:text-text-primary',
        secondary: 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary shadow-sm',
        ghost: 'hover:bg-surface-secondary text-text-primary',
        link: 'text-accent underline-offset-4 hover:underline',
        accent: 'bg-accent text-btn-primary-text hover:bg-accent-dark shadow-sm hover:shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
