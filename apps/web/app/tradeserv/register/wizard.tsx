'use client';

import { ArrowLeft, ArrowRight, Save, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from './components/progress-bar';
import { Step1BasicInfo } from './steps/step-1-basic-info';
import { Step2ProfessionalInfo } from './steps/step-2-professional-info';
import { Step3Services } from './steps/step-3-services';
import { Step4Portfolio } from './steps/step-4-portfolio';
import { Step5Documents } from './steps/step-5-documents';
import { Step6Membership } from './steps/step-6-membership';
import { Step7Review } from './steps/step-7-review';
import { useWizardState } from './hooks/use-wizard-state';
import { STEPS } from './types';

export function RegistrationWizard() {
  const {
    currentStep, data, errors, isDirty, lastSaved, isSubmitting,
    updateField, goToStep, goNext, goBack, saveDraft, submit, clearDraft,
  } = useWizardState();

  return (
    <div className="min-h-screen bg-bg-base">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.06), transparent)',
        }}
      />
      <div className="relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="container-main max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Join TradeServ
            </h1>
            <p className="mt-2 text-sm text-text-tertiary">
              Complete your professional registration. All fields with <span className="text-accent">*</span> are required.
            </p>
          </div>

          <div className="mb-8 overflow-x-auto px-2">
            <ProgressBar currentStep={currentStep} />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-[10px] text-text-tertiary">{lastSaved}</span>
              )}
              {isDirty && (
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse-soft" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] font-medium text-text-tertiary transition-colors hover:border-accent/30 hover:text-text-secondary"
              >
                <Save size={12} />
                Save Draft
              </button>
              <button
                onClick={clearDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] font-medium text-text-tertiary transition-colors hover:border-red-400/30 hover:text-red-400"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary">
                Step {currentStep}: {STEPS[currentStep - 1].title}
              </h2>
            </div>

            {currentStep === 1 && (
              <Step1BasicInfo data={data} errors={errors} onChange={updateField} />
            )}
            {currentStep === 2 && (
              <Step2ProfessionalInfo data={data} errors={errors} onChange={updateField} />
            )}
            {currentStep === 3 && (
              <Step3Services data={data} errors={errors} onChange={updateField} />
            )}
            {currentStep === 4 && (
              <Step4Portfolio data={data} errors={errors} onChange={updateField} />
            )}
            {currentStep === 5 && (
              <Step5Documents data={data} errors={errors} onChange={updateField} />
            )}
            {currentStep === 6 && (
              <Step6Membership data={data} errors={errors} onChange={updateField} />
            )}
            {currentStep === 7 && (
              <Step7Review data={data} errors={errors} onChange={updateField} />
            )}

            <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
              <button
                onClick={goBack}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-all duration-200 hover:border-border disabled:opacity-30 disabled:cursor-not-allowed hover:text-text-primary"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-text-tertiary">
                  Step {currentStep} of {STEPS.length}
                </span>
                {currentStep < STEPS.length ? (
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-btn-primary-text transition-all duration-200 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-2.5 text-sm font-semibold text-btn-primary-text transition-all duration-200 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="xs" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Registration'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
