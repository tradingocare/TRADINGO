'use client';

import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface FacetGroup {
  key: string;
  label: string;
  options: FacetOption[];
  type: 'checkbox' | 'radio' | 'range';
}

interface FacetedFiltersProps {
  groups: FacetGroup[];
  selected: Record<string, string[]>;
  onChange: (key: string, values: string[]) => void;
  onReset: () => void;
  className?: string;
}

function FacetSection({ label, options, type, selected, onToggle, defaultOpen }: {
  label: string;
  options: FacetOption[];
  type: 'checkbox' | 'radio';
  selected: string[];
  onToggle: (value: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (options.length === 0) return null;

  return (
    <div className="border-b border-border pb-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary"
        aria-expanded={open}
      >
        {label}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-surface-secondary"
              >
                <input
                  type={type === 'radio' ? 'radio' : 'checkbox'}
                  checked={isSelected}
                  onChange={() => onToggle(opt.value)}
                  className="h-3.5 w-3.5 accent-accent"
                />
                <span className="flex-1 text-text-secondary">{opt.label}</span>
                <span className="text-[10px] text-text-tertiary">({opt.count})</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const FacetedFilters = memo(function FacetedFilters({
  groups,
  selected,
  onChange,
  onReset,
  className,
}: FacetedFiltersProps) {
  const hasActive = Object.values(selected).some((v) => v.length > 0);

  const handleToggle = useCallback((key: string, value: string) => {
    const current = selected[key] ?? [];
    const type = groups.find((g) => g.key === key)?.type;
    if (type === 'radio') {
      onChange(key, current.includes(value) ? [] : [value]);
    } else {
      onChange(
        key,
        current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      );
    }
  }, [selected, groups, onChange]);

  if (groups.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Filters</h3>
        {hasActive && (
          <button type="button" onClick={onReset} className="text-xs text-accent hover:text-accent/80">
            Clear All
          </button>
        )}
      </div>
      <div className="mt-3 space-y-1">
        {groups.map((group, i) => (
          <FacetSection
            key={group.key}
            label={group.label}
            options={group.options}
            type={group.type === 'range' ? 'checkbox' : group.type}
            selected={selected[group.key] ?? []}
            onToggle={(value) => handleToggle(group.key, value)}
            defaultOpen={i < 3}
          />
        ))}
      </div>
    </div>
  );
});