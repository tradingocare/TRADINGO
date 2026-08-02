'use client';

import { STEPS } from '../types';

export function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm ${
                  step.id === currentStep
                    ? 'bg-accent text-text-primary shadow-lg shadow-accent/30'
                    : step.id < currentStep
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-surface text-text-tertiary border border-border'
                }`}
              >
                {step.id < currentStep ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`mt-1.5 hidden text-[10px] font-medium uppercase tracking-wider sm:block ${
                  step.id <= currentStep ? 'text-text-secondary' : 'text-text-tertiary'
                }`}
              >
                {step.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-8 transition-colors duration-300 sm:mx-3 sm:w-12 md:w-20 ${
                  step.id < currentStep ? 'bg-accent/50' : 'bg-text-tertiary'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-center sm:hidden">
        <span className="text-xs text-text-tertiary">
          Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].title}
        </span>
      </div>
    </div>
  );
}
