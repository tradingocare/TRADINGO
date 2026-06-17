'use client';

import { HelpCircle } from 'lucide-react';
import { AttributeValue } from './attribute-value';
import type { ProductAttributeField } from '@/types/product-detail';

interface AttributeRowProps {
  field: ProductAttributeField;
}

export function AttributeRow({ field }: AttributeRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-surface-secondary/50 dark:hover:bg-dark-surface-secondary/50">
      <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0 w-2/5">
        <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary truncate">
          {field.label}
        </span>
        {field.helpText && (
          <span className="group relative flex-shrink-0">
            <HelpCircle className="h-3.5 w-3.5 text-text-tertiary cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 w-48 rounded-lg bg-surface-secondary px-2.5 py-1.5 text-xs text-text-primary shadow-lg border border-border dark:bg-dark-surface-secondary dark:text-dark-text-primary dark:border-dark-border">
              {field.helpText}
            </span>
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-right">
        <AttributeValue field={field} />
      </div>
    </div>
  );
}
