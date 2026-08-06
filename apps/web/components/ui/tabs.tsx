'use client';

import { type ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'pills' | 'underline';
}

export function Tabs({ tabs, value, onChange, className, variant = 'pills' }: TabsProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      }
      if (nextIndex !== null) {
        e.preventDefault();
        const nextTab = tabs[nextIndex];
        if (nextTab && !nextTab.disabled) {
          onChange(nextTab.value);
        }
      }
    },
    [tabs, onChange],
  );

  if (variant === 'underline') {
    return (
      <div className={cn('flex border-b border-divider', className)} role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={value === tab.value}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            tabIndex={value === tab.value ? 0 : -1}
            className={cn(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-40',
              value === tab.value
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.icon}
            {tab.label}
            {value === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-1.5', className)} role="tablist">
      {tabs.map((tab, i) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          disabled={tab.disabled}
          onClick={() => onChange(tab.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          tabIndex={value === tab.value ? 0 : -1}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40',
            value === tab.value
              ? 'bg-accent/10 text-accent shadow-sm'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
