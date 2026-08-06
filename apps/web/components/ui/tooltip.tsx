'use client';

import { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tooltipVariants = cva(
  'pointer-events-none absolute z-[60] whitespace-nowrap rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-200 group-hover:opacity-100',
  {
    variants: {
      side: {
        top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
        bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
        left: 'right-full top-1/2 mr-2 -translate-y-1/2',
        right: 'left-full top-1/2 ml-2 -translate-y-1/2',
      },
    },
    defaultVariants: { side: 'top' },
  },
);

export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  content: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, side, className }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className={cn(tooltipVariants({ side }), className)} role="tooltip">
        {content}
      </div>
    </div>
  );
}
