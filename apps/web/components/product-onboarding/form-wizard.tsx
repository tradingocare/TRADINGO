'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WizardStep, ProductCompletenessScore } from '@/lib/product-onboarding/types';

interface FormWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSave: () => void;
  children: React.ReactNode;
  isSaving?: boolean;
  lastAutoSavedAt?: string;
  completeness?: ProductCompletenessScore | null;
}

export function FormWizard({
  steps,
  currentStep,
  onStepChange,
  onSave,
  children,
  isSaving,
  lastAutoSavedAt,
  completeness,
}: FormWizardProps) {
  const totalSteps = steps.length;
  const isFirst = currentStep === steps[0]?.id;
  const isLast = currentStep === steps[totalSteps - 1]?.id;

  const saveIndicator = useMemo(() => {
    if (isSaving) return { text: 'Saving...', icon: Clock, className: 'text-amber-500' };
    if (lastAutoSavedAt) {
      const seconds = Math.floor((Date.now() - new Date(lastAutoSavedAt).getTime()) / 1000);
      if (seconds < 10) return { text: 'Auto-saved just now', icon: CheckCircle2, className: 'text-accent-500' };
      if (seconds < 60) return { text: `Auto-saved ${seconds}s ago`, icon: CheckCircle2, className: 'text-accent-500' };
      return { text: `Auto-saved ${Math.floor(seconds / 60)}m ago`, icon: CheckCircle2, className: 'text-accent-500' };
    }
    return null;
  }, [isSaving, lastAutoSavedAt]);

  const stepCompleteness = useMemo(() => {
    if (!completeness) return new Map<number, number>();
    const sectionScores: Record<string, number> = {
      basic: completeness.basicInfo,
      specifications: completeness.specifications,
      media: completeness.media,
      pricing: completeness.pricing,
      variants: completeness.variants,
      certifications: completeness.certifications,
      localization: completeness.localization,
    };
    const map = new Map<number, number>();
    for (const step of steps) {
      let score = 0;
      let count = 0;
      for (const section of step.sections) {
        const s = sectionScores[section];
        if (s !== undefined) { score += s; count++; }
      }
      if (count > 0) {
        map.set(step.id, Math.round(score / count));
      }
    }
    return map;
  }, [completeness, steps]);

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const score = stepCompleteness.get(step.id);
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isClickable = step.id < currentStep;

              return (
                <div key={step.id} className="flex items-center gap-4">
                  {index > 0 && (
                    <div
                      className={cn(
                        'h-px w-8 sm:w-12',
                        isCompleted ? 'bg-primary-500' : 'bg-border dark:bg-dark-border',
                      )}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => isClickable && onStepChange(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      'flex items-center gap-2 text-left transition-colors',
                      isClickable && 'cursor-pointer',
                      !isClickable && 'cursor-default',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                        isActive && 'border-primary-600 bg-primary-600 text-white shadow-md',
                        isCompleted && 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400',
                        !isActive && !isCompleted && 'border-border bg-surface-secondary text-text-tertiary dark:border-dark-border dark:bg-dark-surface-secondary',
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium leading-tight',
                          isActive ? 'text-text-primary dark:text-dark-text-primary' : 'text-text-secondary dark:text-dark-text-secondary',
                        )}
                      >
                        {step.title}
                      </p>
                      {score !== undefined && (
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <div className="h-1 w-12 overflow-hidden rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                score >= 80 ? 'bg-accent-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500',
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-text-tertiary">{score}%</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
          {saveIndicator && (
            <div className={cn('hidden sm:flex items-center gap-1.5 text-xs shrink-0 ml-4', saveIndicator.className)}>
              <saveIndicator.icon className="h-3.5 w-3.5" />
              <span>{saveIndicator.text}</span>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0">{children}</div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center gap-2">
          {saveIndicator && (
            <div className={cn('flex sm:hidden items-center gap-1.5 text-xs', saveIndicator.className)}>
              <saveIndicator.icon className="h-3.5 w-3.5" />
              <span>{saveIndicator.text}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isFirst && (
            <Button variant="outline" onClick={() => onStepChange(currentStep - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          )}
          <Button variant="secondary" onClick={onSave} disabled={isSaving}>
            <Save className="mr-1 h-4 w-4" />
            Save Draft
          </Button>
          {!isLast ? (
            <Button onClick={() => onStepChange(currentStep + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="accent" onClick={() => onStepChange(-1)}>
              Submit for Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
