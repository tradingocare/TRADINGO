'use client';

import { VERIFICATION_TIMELINE } from '../types';
import { type VerificationStatus } from '../types';

function getTimelineProgress(status: VerificationStatus): number {
  switch (status) {
    case 'pending': return 2;
    case 'documents_submitted': return 3;
    case 'under_review': return 5;
    case 'needs_resubmission': return 3;
    case 'approved': return 7;
    case 'rejected': return 0;
    case 'suspended': return 0;
    case 'expired': return 0;
  }
}

export function VerificationTimeline({ status }: { status: VerificationStatus }) {
  const progress = getTimelineProgress(status);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Verification Timeline</h3>
      <div className="relative">
        <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-0.5 bg-border" />
        <div
          className="absolute left-[15px] top-2 w-0.5 bg-accent/50 transition-all duration-700"
          style={{ height: `${(progress / VERIFICATION_TIMELINE.length) * 100}%` }}
        />
        <div className="space-y-6">
          {VERIFICATION_TIMELINE.map((step) => {
            const isActive = step.step <= progress;
            const isCurrent = step.step === progress;
            return (
              <div key={step.key} className="relative flex items-center gap-4 pl-10">
                <div
                  className={`absolute left-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500 ${
                    isActive
                      ? isCurrent
                        ? 'bg-accent text-text-primary shadow-lg shadow-accent/30 scale-110'
                        : 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-surface text-text-tertiary border border-border'
                  }`}
                >
                  {isActive && step.step < progress ? (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.step
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="mt-0.5 text-[10px] text-accent">In progress</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
