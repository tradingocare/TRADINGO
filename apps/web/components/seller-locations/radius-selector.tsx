'use client';

import type { GeographicReach } from '@prisma/client';

const RADIUS_OPTIONS: { label: string; value: GeographicReach; description: string }[] = [
  { label: 'Local (5 km)', value: 'LOCAL', description: 'Nearby area' },
  { label: 'District (10 km)', value: 'DISTRICT', description: 'District-wide' },
  { label: 'State (300 km)', value: 'STATE', description: 'Same state' },
  { label: 'Pan India (2000 km)', value: 'PAN_INDIA', description: 'All India' },
  { label: 'Global (20000 km)', value: 'GLOBAL', description: 'Worldwide' },
];

interface RadiusSelectorProps {
  value?: GeographicReach | null;
  onChange: (value: GeographicReach) => void;
  disabled?: boolean;
}

export function RadiusSelector({ value, onChange, disabled }: RadiusSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
        Visibility Radius
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {RADIUS_OPTIONS.map((option) => {
          const isSelected = value === option.value || (!value && option.value === 'LOCAL');
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary dark:border-primary-dark dark:bg-primary-dark/10 dark:text-primary-dark'
                  : 'border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface text-text-secondary dark:text-dark-text-secondary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary'
              } disabled:opacity-50`}
            >
              <span className="block leading-tight">{option.label}</span>
              <span className="block text-[10px] opacity-70 mt-0.5">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
