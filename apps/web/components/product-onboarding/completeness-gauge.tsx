'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ProductCompletenessScore, ProductDraft } from '@/lib/product-onboarding/types';

interface CompletenessGaugeProps {
  score: ProductCompletenessScore | null;
  draft: ProductDraft | null;
}

interface CategoryDef {
  key: string;
  label: string;
  value: number;
}

function getColor(score: number): string {
  if (score < 40) return 'text-red-500';
  if (score < 70) return 'text-amber-500';
  if (score < 90) return 'text-blue-500';
  return 'text-accent-500';
}

function getStrokeColor(score: number): string {
  if (score < 40) return '#ef4444';
  if (score < 70) return '#f59e0b';
  if (score < 90) return '#3b82f6';
  return '#16a34a';
}

function getBarColor(score: number): string {
  if (score < 40) return 'bg-red-500';
  if (score < 70) return 'bg-amber-500';
  if (score < 90) return 'bg-blue-500';
  return 'bg-accent-500';
}

function getNextActions(score: ProductCompletenessScore): { label: string; field: string }[] {
  const actions: { label: string; field: string }[] = [];
  const categories: { key: keyof ProductCompletenessScore; label: string }[] = [
    { key: 'basicInfo', label: 'Complete basic information' },
    { key: 'specifications', label: 'Add technical specifications' },
    { key: 'media', label: 'Upload product media' },
    { key: 'pricing', label: 'Set pricing details' },
    { key: 'variants', label: 'Add product variants' },
    { key: 'certifications', label: 'Add certifications' },
    { key: 'localization', label: 'Add multi-language descriptions' },
    { key: 'logistics', label: 'Set logistics information' },
  ];
  for (const cat of categories) {
    const val = score[cat.key] as number;
    if (val < 100) {
      actions.push({ label: cat.label, field: cat.key });
    }
    if (actions.length >= 5) break;
  }
  return actions;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CompletenessGauge({ score, draft }: CompletenessGaugeProps) {
  const total = score?.total ?? 0;
  const textColor = getColor(total);
  const strokeColor = getStrokeColor(total);
  const offset = CIRCUMFERENCE - (total / 100) * CIRCUMFERENCE;

  const categories: CategoryDef[] = useMemo(() => {
    if (!score) return [];
    return [
      { key: 'basicInfo', label: 'Basic Info', value: score.basicInfo },
      { key: 'specifications', label: 'Specifications', value: score.specifications },
      { key: 'media', label: 'Media', value: score.media },
      { key: 'pricing', label: 'Pricing', value: score.pricing },
      { key: 'variants', label: 'Variants', value: score.variants },
      { key: 'certifications', label: 'Certifications', value: score.certifications },
      { key: 'localization', label: 'Localization', value: score.localization },
      { key: 'logistics', label: 'Logistics', value: score.logistics },
    ];
  }, [score]);

  const nextActions = useMemo(() => {
    if (!score) return [];
    return getNextActions(score);
  }, [score]);

  if (!score || !draft) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-8 dark:border-dark-border dark:bg-dark-surface">
        <p className="text-sm text-text-tertiary">No completeness data available yet. Start filling in your product details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-surface-tertiary dark:text-dark-surface-tertiary"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-3xl font-bold', textColor)}>{total}%</span>
            <span className="text-xs text-text-tertiary">Complete</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center gap-3">
              <span className="w-24 text-xs text-text-secondary dark:text-dark-text-secondary">
                {cat.label}
              </span>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', getBarColor(cat.value))}
                    style={{ width: `${cat.value}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                {cat.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {nextActions.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-secondary p-4 dark:border-dark-border dark:bg-dark-surface-secondary">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary">
            Next Actions
          </h4>
          <ul className="space-y-1.5">
            {nextActions.map((action, idx) => (
              <li key={action.field} className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text-primary">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-xs font-medium text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                  {idx + 1}
                </span>
                {action.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {total >= 100 && (
        <div className="rounded-lg border border-accent-200 bg-accent-50 p-4 text-center text-sm text-accent-700 dark:border-accent-800 dark:bg-accent-900/20 dark:text-accent-400">
          All sections are complete! Your product is ready for review.
        </div>
      )}
    </div>
  );
}
