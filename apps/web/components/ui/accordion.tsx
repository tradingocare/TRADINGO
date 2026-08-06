'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  value: string;
  title: string;
  children: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

export function Accordion({ items, type = 'single', defaultValue, className }: AccordionProps) {
  const [openValues, setOpenValues] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    if (type === 'single') return new Set([defaultValue as string]);
    return new Set(defaultValue as string[]);
  });

  const toggle = (value: string) => {
    setOpenValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else if (type === 'single') {
        return new Set([value]);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  return (
    <div className={cn('divide-y divide-border rounded-xl border border-border bg-surface-secondary', className)}>
      {items.map((item) => {
        const isOpen = openValues.has(item.value);
        return (
          <div key={item.value}>
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => toggle(item.value)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary transition-all duration-200 hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-40"
              aria-expanded={isOpen}
            >
              {item.title}
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-300',
                  isOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-out',
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <div className="px-4 pb-3 pt-1 text-sm text-text-secondary">{item.children}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
