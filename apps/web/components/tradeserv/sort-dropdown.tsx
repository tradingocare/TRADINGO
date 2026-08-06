'use client';

import { ArrowUpDown, TrendingUp, Clock, Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'near-best' | 'rating' | 'experience' | 'recently-active';

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'near-best', label: 'Near \u2192 Far \u2192 Best\u2122', icon: MapPin },
  { value: 'rating', label: 'Highest Rated', icon: Star },
  { value: 'experience', label: 'Most Experienced', icon: TrendingUp },
  { value: 'recently-active', label: 'Recently Active', icon: Clock },
];

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const current = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-tertiary">Sort:</span>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all',
                   value === opt.value
                     ? 'border border-accent/30 bg-accent/10 text-accent'
                    : 'border border-border bg-surface text-text-tertiary hover:border-border hover:text-text-secondary'
                )}
              >
                <OptIcon className="h-3 w-3" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
