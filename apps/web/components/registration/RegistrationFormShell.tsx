'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type RegistrationStepVisualState = 'complete' | 'current' | 'pending' | 'error';

export interface RegistrationShellStep {
  number: number;
  title: string;
  subtitle?: string;
  state: RegistrationStepVisualState;
}

export interface RegistrationShellPlan {
  name: string;
  detail?: string;
  priceLabel?: string;
  isFree?: boolean;
}

export type RegistrationSaveState = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

export interface RegistrationFormShellProps {
  title: string;
  contextLabel?: string;
  formId: string | null;
  formLoading?: boolean;
  formCreatedAt?: string | null;
  steps: RegistrationShellStep[];
  currentStep: number;
  totalSteps: number;
  progressPct?: number;
  plan?: RegistrationShellPlan | null;
  saveState?: RegistrationSaveState;
  saveMessage?: string | null;
  onReloadConflict?: () => void;
  errorMessage?: string | null;
  validationSummary?: string[];
  notice?: { tone: 'info' | 'warn'; text: string } | null;
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  finalAction?: ReactNode;
  children: ReactNode;
}

function StepDot({ step }: { step: RegistrationShellStep }) {
  const label = `Step ${step.number}: ${step.title} (${step.state})`;
  return (
    <li className="flex flex-col items-center gap-1 min-w-0" aria-label={label} aria-current={step.state === 'current' ? 'step' : undefined}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300"
        style={{
          background: step.state === 'complete' ? 'rgba(74,222,128,0.2)' : step.state === 'current' ? 'rgba(245, 158, 11, 0.2)' : step.state === 'error' ? 'rgba(239,68,68,0.15)' : undefined,
          border: step.state === 'complete' ? '1px solid rgba(74,222,128,0.5)' : step.state === 'current' ? '1px solid rgba(245, 158, 11, 0.5)' : step.state === 'error' ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-color)',
          color: step.state === 'complete' ? '#4ade80' : step.state === 'current' ? '#f59e0b' : step.state === 'error' ? '#f87171' : 'var(--text-tertiary)',
        }}
      >
        {step.state === 'complete' ? <CheckCircle2 size={14} aria-hidden /> : step.state === 'error' ? <AlertCircle size={14} aria-hidden /> : step.number}
      </div>
      <span className="text-[9px] hidden sm:block text-text-tertiary">{step.title}</span>
    </li>
  );
}

export function RegistrationFormShell({
  title,
  contextLabel,
  formId,
  formLoading = false,
  formCreatedAt,
  steps,
  currentStep,
  totalSteps,
  progressPct,
  plan,
  saveState = 'idle',
  saveMessage,
  onReloadConflict,
  errorMessage,
  validationSummary = [],
  notice,
  onPrevious,
  onNext,
  previousLabel = 'Back',
  nextLabel = 'Continue',
  canGoPrevious = true,
  canGoNext = true,
  finalAction,
  children,
}: RegistrationFormShellProps) {
  const pct = progressPct ?? Math.round(((Math.min(currentStep, totalSteps) - 1) / Math.max(totalSteps - 1, 1)) * 100);

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-text-primary font-bold text-sm">
            {title}
            {contextLabel && <span className="text-text-tertiary font-normal"> — {contextLabel}</span>}
          </p>
          {formLoading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary" role="status" aria-label="Loading form reference">
              <LoadingSpinner size="xs" /> Form ID…
            </span>
          ) : formId ? (
            <Badge variant="outline" aria-label={`Form reference ${formId}`}>
              Form {formId}
              {formCreatedAt ? ` · ${formCreatedAt}` : ''}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-text-primary font-bold text-sm" aria-live="polite">
            Step {currentStep} of {totalSteps}
          </p>
          {saveState === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary" role="status">
              <LoadingSpinner size="xs" /> Saving draft…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="inline-flex items-center gap-1 text-xs text-green-400" role="status">
              <CheckCircle2 size={12} aria-hidden /> Draft saved
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mb-5 bg-bg-elevated" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Registration progress">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,rgba(245,158,11,1),rgba(251,191,36,1))' }} />
        </div>
        <ol className="flex items-start justify-between gap-1 overflow-x-auto pb-1" aria-label="Registration steps">
          {steps.map((s) => (
            <StepDot key={s.number} step={s} />
          ))}
        </ol>
      </div>

      {plan && (
        <div className="mb-6 px-4 py-3 rounded-xl flex flex-wrap items-center gap-2" style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }} aria-label={`Selected plan: ${plan.name}`}>
          <p className="text-text-primary text-sm font-bold">{plan.name}</p>
          {plan.isFree && (
            <Badge variant="secondary">Free</Badge>
          )}
          {plan.detail && <p className="text-text-secondary text-xs">{plan.detail}</p>}
          {plan.priceLabel && <p className="text-text-tertiary text-xs ml-auto">{plan.priceLabel}</p>}
        </div>
      )}

      {saveState === 'conflict' && (
        <div className="mb-5 px-4 py-3 rounded-xl flex flex-wrap items-center gap-3" role="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} className="text-red-400 shrink-0" aria-hidden />
          <p className="text-red-300 text-xs flex-1 min-w-0">{saveMessage || 'A newer version of this form exists.'}</p>
          {onReloadConflict && (
            <Button type="button" size="sm" variant="outline" onClick={onReloadConflict}>
              <RefreshCw size={12} aria-hidden /> Reload latest
            </Button>
          )}
        </div>
      )}

      {saveState === 'error' && saveMessage && (
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5" role="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} className="text-red-400 shrink-0" aria-hidden />
          <p className="text-red-300 text-xs">{saveMessage}</p>
        </div>
      )}

      {notice && (
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5" style={notice.tone === 'warn'
          ? { background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }
          : { background: 'rgba(61,139,255,0.08)', border: '1px solid rgba(61,139,255,0.25)' }}>
          <Info size={15} className="shrink-0 text-text-secondary" aria-hidden />
          <p className="text-text-secondary text-xs">{notice.text}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5" role="alert" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} className="text-red-400 shrink-0" aria-hidden />
          <p className="text-red-300 text-xs">{errorMessage}</p>
        </div>
      )}

      {validationSummary.length > 0 && (
        <div className="mb-5 px-4 py-3 rounded-xl" role="alert" aria-label="Validation summary" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <ul className="list-disc pl-5 space-y-1">
            {validationSummary.map((item, i) => (
              <li key={i} className="text-red-300 text-xs">{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div>{children}</div>

      {(onPrevious || onNext || finalAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {onPrevious && (
            <Button type="button" variant="outline" onClick={onPrevious} disabled={!canGoPrevious} className="flex-1" aria-label={previousLabel}>
              {previousLabel}
            </Button>
          )}
          {onNext && (
            <Button type="button" onClick={onNext} disabled={!canGoNext} className="flex-1" aria-label={nextLabel}>
              {nextLabel}
            </Button>
          )}
          {finalAction}
        </div>
      )}
    </div>
  );
}
