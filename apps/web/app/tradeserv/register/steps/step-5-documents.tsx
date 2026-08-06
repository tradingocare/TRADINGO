'use client';

import { Upload, X } from 'lucide-react';
import type { RegistrationData } from '../types';
import type { StepErrors } from '../validation';

interface Props {
  data: RegistrationData;
  errors: StepErrors;
  onChange: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
}

export function Step5Documents({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Identity Proof (optional)</h3>
        <p className="mt-1 text-xs text-text-tertiary">Upload Aadhaar, PAN card, or any government-issued ID.</p>
        <div className="mt-3">
          {data.identityDocName ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <span className="text-sm text-text-secondary">{data.identityDocName}</span>
              <button onClick={() => onChange('identityDocName', '')} className="p-1 text-text-tertiary hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-6 transition-colors hover:border-accent/30 hover:bg-surface">
              <Upload size={16} className="text-text-tertiary" />
              <span className="text-sm text-text-tertiary">Click to upload identity document</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onChange('identityDocName', file.name);
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Qualification Certificates (optional)</h3>
        <p className="mt-1 text-xs text-text-tertiary">Degree certificates, mark sheets, or professional qualification documents.</p>
        <div className="mt-3 space-y-2">
          {data.qualificationDocNames.map((name, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <span className="text-sm text-text-secondary">{name}</span>
              <button
                onClick={() => onChange('qualificationDocNames', data.qualificationDocNames.filter((_, j) => j !== i))}
                className="p-1 text-text-tertiary hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-4 transition-colors hover:border-accent/30 hover:bg-surface">
            <Upload size={14} className="text-text-tertiary" />
            <span className="text-xs text-text-tertiary">Upload qualification documents</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                onChange('qualificationDocNames', [...data.qualificationDocNames, ...files.map((f) => f.name)]);
              }}
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Other Documents (optional)</h3>
        <p className="mt-1 text-xs text-text-tertiary">Any additional documents supporting your professional profile.</p>
        <div className="mt-3 space-y-2">
          {data.otherDocNames.map((name, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <span className="text-sm text-text-secondary">{name}</span>
              <button
                onClick={() => onChange('otherDocNames', data.otherDocNames.filter((_, j) => j !== i))}
                className="p-1 text-text-tertiary hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-4 transition-colors hover:border-accent/30 hover:bg-surface">
            <Upload size={14} className="text-text-tertiary" />
            <span className="text-xs text-text-tertiary">Upload additional documents</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                onChange('otherDocNames', [...data.otherDocNames, ...files.map((f) => f.name)]);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
