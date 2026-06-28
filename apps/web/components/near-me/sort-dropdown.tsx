'use client';

import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from '@/data/master-data';

type SortOption = 'distance' | 'trust' | 'price_asc' | 'price_desc' | 'trending' | 'delivery';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="h-10 appearance-none rounded-lg border border-border bg-surface pl-9 pr-8 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
    </div>
  );
}
