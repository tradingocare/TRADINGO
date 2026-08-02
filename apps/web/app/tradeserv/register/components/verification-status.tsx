'use client';

import { VERIFICATION_STATES, type VerificationStatus } from '../types';

const STATUS_STYLES: Record<VerificationStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  documents_submitted: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  under_review: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  needs_resubmission: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  suspended: { bg: 'bg-bg-elevated', text: 'text-gray-400', dot: 'bg-gray-400' },
  expired: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' },
};

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const state = VERIFICATION_STATES.find((s) => s.value === status);
  const style = STATUS_STYLES[status];
  if (!state || !style) return null;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${style.bg} px-4 py-1.5 ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      <span className="text-xs font-semibold">{state.label}</span>
    </div>
  );
}

export function VerificationStatusCard({ status }: { status: VerificationStatus }) {
  const state = VERIFICATION_STATES.find((s) => s.value === status);
  const style = STATUS_STYLES[status];
  if (!state || !style) return null;

  return (
    <div className={`rounded-xl border ${style.bg.replace('bg-', 'border-').replace('/10', '/20')} ${style.bg} p-5`}>
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${style.dot}`} />
        <div>
          <p className={`text-sm font-bold ${style.text}`}>{state.label}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">{state.description}</p>
        </div>
      </div>
    </div>
  );
}

export function VerificationStatusEngine({ status }: { status: VerificationStatus }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Verification Status</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {VERIFICATION_STATES.map((state) => {
          const active = state.value === status;
          const style = STATUS_STYLES[state.value];
          return (
            <div
              key={state.value}
              className={`rounded-lg border p-3 transition-all duration-300 ${
                active
                  ? `${style.bg} ${style.text} border-current`
                  : 'border-border bg-surface text-text-tertiary'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${active ? style.dot : 'bg-text-tertiary'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{state.label}</span>
              </div>
              {active && (
                <p className="mt-1.5 text-[10px] leading-relaxed text-text-tertiary">{state.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
