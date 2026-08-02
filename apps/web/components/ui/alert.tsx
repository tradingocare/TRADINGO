'use client';

import { type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative flex items-start gap-3 rounded-xl border p-4 text-sm backdrop-blur-sm',
  {
    variants: {
      variant: {
        info: 'border-status-info/20 bg-status-info/5 text-status-info',
        success: 'border-status-success/20 bg-status-success/5 text-status-success',
        warning: 'border-status-warning/20 bg-status-warning/5 text-status-warning',
        error: 'border-status-error/20 bg-status-error/5 text-status-error',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode;
  title?: string;
  className?: string;
  onClose?: () => void;
}

export function Alert({ children, title, variant = 'info', className, onClose }: AlertProps) {
  const Icon = iconMap[variant || 'info'];

  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="text-[13px] leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-60 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Dismiss alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
