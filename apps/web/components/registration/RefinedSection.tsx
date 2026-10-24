'use client';

import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Refined section chrome for the canonical seller registration form.
 * Presentational only: hierarchy (badge + helper), required-field progress,
 * optional completion bar and validation summary around existing step
 * content. No data fetching, no validation rules, no state of its own —
 * counts and messages are computed by the owning step from its existing
 * validation state.
 */
export interface RefinedSectionProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  helperText?: string;
  requiredDone?: number;
  requiredTotal?: number;
  completionPct?: number;
  validationSummary?: string[];
  children: ReactNode;
}

export function RefinedSection({
  icon,
  title,
  subtitle,
  helperText,
  requiredDone,
  requiredTotal,
  completionPct,
  validationSummary = [],
  children,
}: RefinedSectionProps) {
  const showCounter =
    typeof requiredDone === 'number' && typeof requiredTotal === 'number' && requiredTotal > 0;

  return (
    <section aria-label={title} className="rounded-2xl p-5 sm:p-6 bg-surface" style={{ border: '1px solid var(--border-color)' }}>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-text-primary font-bold text-base leading-tight">{title}</h2>
          {subtitle && <p className="text-text-tertiary text-xs mt-0.5">{subtitle}</p>}
        </div>
        {showCounter && (
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--text-primary)' }}
            aria-label={`${requiredDone} of ${requiredTotal} required fields complete`}
          >
            {requiredDone}/{requiredTotal} required
          </span>
        )}
      </div>

      {helperText && (
        <p className="text-text-secondary text-xs leading-relaxed mt-2 mb-4">{helperText}</p>
      )}

      {typeof completionPct === 'number' && (
        <div className="h-1 rounded-full overflow-hidden mb-4 bg-bg-elevated" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${title} completion`}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, completionPct))}%`, background: 'linear-gradient(90deg,rgba(245,158,11,1),rgba(251,191,36,1))' }} />
        </div>
      )}

      {validationSummary.length > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl" role="alert" aria-label={`${title} validation summary`} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <ul className="list-disc pl-5 space-y-1">
            {validationSummary.map((item, i) => (
              <li key={i} className="text-red-300 text-xs">{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        {children}
        {validationSummary.length > 0 && (
          <p className="text-red-400 text-[10px] flex items-center gap-1">
            <AlertCircle size={11} aria-hidden /> Please fix the highlighted fields above.
          </p>
        )}
      </div>
    </section>
  );
}
