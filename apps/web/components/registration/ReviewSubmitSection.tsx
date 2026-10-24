'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, Pencil } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';

export type ReviewSubmitState =
  | 'ready'
  | 'blocked'
  | 'submitting'
  | 'success'
  | 'conflict'
  | 'unauthorized'
  | 'error'
  | 'rejected'
  | 'terminal';

export interface ReviewSectionItem {
  key: string;
  label: string;
  value: string;
  complete: boolean;
  step: number;
}

export interface ReviewSubmitSectionProps {
  sections: ReviewSectionItem[];
  planName: string;
  planDetail: string;
  planPrice: string;
  isFreePlan: boolean;
  formId: string | null;
  declarations: { label: string; checked: boolean }[];
  declarationDocs: { label: string; href: string }[];
  submitState: ReviewSubmitState;
  submitMessage?: string | null;
  canSubmit: boolean;
  onEditSection: (step: number) => void;
  onSubmit: () => void;
  onLogin?: () => void;
  onDashboard?: () => void;
}

/**
 * Final review + declaration + submit UX for the canonical seller
 * registration form. Presentational: all data comes from the owning step,
 * all decisions (submit, navigation) flow back out through callbacks.
 * Never fabricates plan data, prices, or Form IDs — absent values render
 * as explicit placeholders.
 */
export function ReviewSubmitSection({
  sections,
  planName,
  planDetail,
  planPrice,
  isFreePlan,
  formId,
  declarations,
  declarationDocs,
  submitState,
  submitMessage,
  canSubmit,
  onEditSection,
  onSubmit,
  onLogin,
  onDashboard,
}: ReviewSubmitSectionProps) {
  const allAccepted = declarations.length > 0 && declarations.every((d) => d.checked);

  return (
    <section aria-label="Review and submit" className="rounded-2xl p-5 sm:p-6 bg-surface" style={{ border: '1px solid var(--border-color)' }}>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h2 className="text-text-primary font-bold text-base leading-tight">Review &amp; Submit</h2>
        {formId ? (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: 'rgba(61,139,255,0.1)', border: '1px solid rgba(61,139,255,0.3)', color: 'var(--text-primary)' }} aria-label={`Application reference ${formId}`}>
            {formId}
          </span>
        ) : (
          <span className="text-[11px] text-text-tertiary" role="status" aria-label="Application reference pending">
            Application reference is issued on first save
          </span>
        )}
      </div>
      <p className="text-text-tertiary text-xs mt-0.5 mb-4">
        Confirm every section below, accept the declaration, then submit. The backend re-validates everything.
      </p>

      <ul className="space-y-2 mb-4" aria-label="Section summary">
        {sections.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
          >
            <span aria-hidden>{s.complete ? <CheckCircle2 size={14} className="text-green-400 shrink-0" /> : <AlertCircle size={14} className="text-text-tertiary shrink-0" />}</span>
            <div className="min-w-0 flex-1">
              <p className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">{s.label}</p>
              <p className="text-text-primary text-xs truncate">{s.value || '—'}</p>
            </div>
            <span className="text-[10px] font-semibold shrink-0" style={{ color: s.complete ? '#4ade80' : 'var(--text-tertiary)' }}>
              {s.complete ? 'Complete' : 'Incomplete'}
            </span>
            <button
              type="button"
              onClick={() => onEditSection(s.step)}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              style={{ color: '#fbbf24' }}
              aria-label={`Edit ${s.label}`}
            >
              <Pencil size={11} aria-hidden /> Edit
            </button>
          </li>
        ))}
      </ul>

      <div className="mb-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }} aria-label={`Selected plan: ${planName}`}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-text-primary text-sm font-bold">{planName}</p>
          {isFreePlan && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
              Free
            </span>
          )}
          <p className="text-text-secondary text-xs ml-auto">{planPrice}</p>
        </div>
        {planDetail && <p className="text-text-tertiary text-xs mt-0.5">{planDetail}</p>}
      </div>

      <div className="mb-4" aria-label="Declaration status">
        <ul className="space-y-1.5">
          {declarations.map((d) => (
            <li key={d.label} className="flex items-center gap-2 text-xs">
              <span aria-hidden>{d.checked ? <CheckCircle2 size={13} className="text-green-400" /> : <span className="inline-block w-[13px] h-[13px] rounded-full" style={{ border: '1px solid var(--border-color)' }} />}</span>
              <span className={d.checked ? 'text-text-secondary' : 'text-text-tertiary'}>{d.label}</span>
            </li>
          ))}
        </ul>
        <p className="text-text-tertiary text-[10px] mt-2">
          Read:{' '}
          {declarationDocs.map((doc, i) => (
            <span key={doc.href}>
              {i > 0 && ' · '}
              <Link href={doc.href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: '#fbbf24' }}>
                {doc.label}
              </Link>
            </span>
          ))}
        </p>
      </div>

      {submitState === 'conflict' && (
        <div className="mb-4 px-4 py-3 rounded-xl flex flex-wrap items-center gap-3" role="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} className="text-red-400 shrink-0" aria-hidden />
          <p className="text-red-300 text-xs flex-1 min-w-0">{submitMessage || 'This application was already submitted.'}</p>
          {onDashboard && (
            <Button type="button" size="sm" variant="outline" onClick={onDashboard}>
              Go to Seller Dashboard
            </Button>
          )}
        </div>
      )}

      {submitState === 'unauthorized' && (
        <div className="mb-4 px-4 py-3 rounded-xl flex flex-wrap items-center gap-3" role="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} className="text-red-400 shrink-0" aria-hidden />
          <p className="text-red-300 text-xs flex-1 min-w-0">{submitMessage || 'Your session expired. Please sign in again.'}</p>
          {onLogin && (
            <Button type="button" size="sm" variant="outline" onClick={onLogin}>
              Sign In
            </Button>
          )}
        </div>
      )}

      {submitState === 'terminal' && (
        <div className="mb-4 px-4 py-3 rounded-xl flex flex-wrap items-center gap-3" role="alert" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <AlertCircle size={15} className="shrink-0" style={{ color: '#f59e0b' }} aria-hidden />
          <p className="text-text-secondary text-xs flex-1 min-w-0">{submitMessage || 'This application can no longer be edited.'}</p>
          {onDashboard && (
            <Button type="button" size="sm" variant="outline" onClick={onDashboard}>
              Go to Seller Dashboard
            </Button>
          )}
        </div>
      )}

      {(submitState === 'error' || submitState === 'rejected') && submitMessage && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2.5" role="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} className="text-red-400 shrink-0" aria-hidden />
          <p className="text-red-300 text-xs">{submitMessage}</p>
        </div>
      )}

      {submitState === 'success' && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2.5" role="status" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}>
          <CheckCircle2 size={15} className="text-green-400 shrink-0" aria-hidden />
          <p className="text-green-300 text-xs">{submitMessage || 'Submitted successfully.'}</p>
        </div>
      )}

      <Button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitState === 'submitting' || submitState === 'success' || submitState === 'terminal'}
        className="w-full"
        aria-label={submitState === 'submitting' ? 'Submitting application' : 'Submit application'}
      >
        {submitState === 'submitting' ? 'Submitting…' : submitState === 'success' ? 'Submitted ✓' : 'Submit Application'}
      </Button>
      {submitState === 'blocked' && (
        <p className="text-text-tertiary text-[10px] mt-2 text-center">
          Complete all sections and accept the declaration to enable submission.
        </p>
      )}
    </section>
  );
}
