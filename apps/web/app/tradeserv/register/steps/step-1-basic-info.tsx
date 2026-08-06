'use client';

import type { RegistrationData } from '../types';
import type { StepErrors } from '../validation';

interface Props {
  data: RegistrationData;
  errors: StepErrors;
  onChange: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
}

export function Step1BasicInfo({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full Name" error={errors.fullName} required>
          <input
            value={data.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="Your full legal name"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
        <Field label="Professional Title" error={errors.professionalTitle} required>
          <input
            value={data.professionalTitle}
            onChange={(e) => onChange('professionalTitle', e.target.value)}
            placeholder="e.g. Senior Chartered Accountant"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Email Address" error={errors.email} required>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
        <Field label="Phone Number" error={errors.phone} required>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="City" error={errors.city} required>
          <input
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Mumbai, Delhi, Bangalore..."
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
        <Field label="State" error={errors.state} required>
          <input
            value={data.state}
            onChange={(e) => onChange('state', e.target.value)}
            placeholder="Maharashtra, Delhi, Karnataka..."
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
      </div>

      <Field label="Professional Bio" error={errors.bio} required>
        <textarea
          value={data.bio}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder="Describe your professional background, expertise, and the value you bring to clients. Minimum 50 characters."
          rows={4}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 resize-y"
        />
        <span className="mt-1 block text-right text-[10px] text-text-tertiary">{data.bio.length} / 50 min</span>
      </Field>
    </div>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
