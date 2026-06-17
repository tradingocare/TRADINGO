'use client';

import { cn } from '@/lib/utils';

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: 'State', value: 300 },
  { label: 'India', value: 2000 },
  { label: 'Export', value: 20000 },
];

interface RadiusSelectorProps {
  selected: number;
  onChange: (radius: number) => void;
  counts?: Record<number, number>;
}

export function RadiusSelector({ selected, onChange, counts }: RadiusSelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {RADIUS_OPTIONS.map((opt) => {
        const isActive = selected === opt.value;
        const count = counts?.[opt.value];
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
              isActive
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-surface text-text-secondary hover:bg-surface-secondary dark:bg-dark-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary',
            )}
          >
            {opt.label}
            {count !== undefined && (
              <span className={cn('ml-1.5 text-xs', isActive ? 'text-primary-100' : 'text-text-tertiary')}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
