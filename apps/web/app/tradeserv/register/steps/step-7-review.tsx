'use client';

import { Shield, Link as LinkIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { RegistrationData } from '../types';
import type { StepErrors } from '../validation';
import { CATEGORIES, PLANS } from '../types';
import { generateSlug, generateCategorySlug } from '../hooks/use-slug';

interface Props {
  data: RegistrationData;
  errors: StepErrors;
  onChange: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-xs text-text-secondary text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function Step7Review({ data, errors, onChange }: Props) {
  const categoryLabel = CATEGORIES.find((c) => c === data.category) || data.category;
  const planLabel = PLANS.find((p) => p.value === data.plan);
  const pricingLabel =
    data.pricingModel === 'hourly' ? 'Hourly Rate' :
    data.pricingModel === 'fixed' ? 'Fixed Price' :
    data.pricingModel === 'project' ? 'Project Based' : '—';

  const previewSlug = data.fullName ? generateSlug(data.fullName) : '';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Review Your Information</h3>
        <p className="mt-1 text-xs text-text-tertiary">Please verify all details before submitting. You can go back to any step to make changes.</p>
      </div>

      <Section title="Basic Information">
        <Row label="Full Name" value={data.fullName || '—'} />
        <Row label="Email" value={data.email || '—'} />
        <Row label="Phone" value={data.phone || '—'} />
        <Row label="Location" value={data.city && data.state ? `${data.city}, ${data.state}` : '—'} />
        <Row label="Professional Title" value={data.professionalTitle || '—'} />
        <Row label="Bio" value={data.bio ? `${data.bio.slice(0, 100)}${data.bio.length > 100 ? '...' : ''}` : '—'} />
      </Section>

      <Section title="Professional Information">
        <Row label="Experience" value={data.yearsOfExperience || '—'} />
        <Row label="Qualifications" value={data.qualifications.length > 0 ? `${data.qualifications.length} qualification(s)` : 'None'} />
        <Row label="Certifications" value={data.certifications.length > 0 ? `${data.certifications.length} certification(s)` : 'None'} />
        <Row label="Languages" value={data.languages.length > 0 ? data.languages.join(', ') : 'None'} />
      </Section>

      <Section title="Services & Pricing">
        <Row label="Category" value={categoryLabel || '—'} />
        <Row label="Services Offered" value={data.services.length > 0 ? `${data.services.length} service(s)` : 'None'} />
        <Row label="Pricing Model" value={pricingLabel} />
        <Row label="Price Range" value={data.priceMin && data.priceMax ? `₹${data.priceMin} - ₹${data.priceMax}` : '—'} />
      </Section>

      <Section title="Portfolio">
        <Row label="Projects" value={data.projects.length > 0 ? `${data.projects.length} project(s)` : 'None'} />
      </Section>

      <Section title="Documents">
        <Row label="Identity Proof" value={data.identityDocName || 'Not uploaded'} />
        <Row label="Qualification Docs" value={data.qualificationDocNames.length > 0 ? `${data.qualificationDocNames.length} file(s)` : 'Not uploaded'} />
        <Row label="Other Documents" value={data.otherDocNames.length > 0 ? `${data.otherDocNames.length} file(s)` : 'Not uploaded'} />
      </Section>

      <Section title="Membership">
        <Row label="Selected Plan" value={planLabel ? `${planLabel.title} (${planLabel.price}${planLabel.period})` : '—'} />
      </Section>

      {data.fullName && (
        <Section title="Reserved URLs (Preview)">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/[0.03] p-3">
              <LinkIcon size={14} className="text-accent shrink-0" />
              <div className="text-xs text-text-secondary font-mono break-all">
                /tradeserv/p/{previewSlug}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/[0.03] p-3">
              <LinkIcon size={14} className="text-purple-400 shrink-0" />
              <div className="text-xs text-text-secondary font-mono break-all">
                /tradeserv/c/{data.category.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}
              </div>
            </div>
            <p className="text-[10px] text-text-tertiary italic">
              A unique slug will be generated and reserved upon submission. These URLs remain private until verification is complete.
            </p>
          </div>
        </Section>
      )}

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-accent shrink-0" />
          <div>
            <p className="text-xs font-medium text-text-secondary">Post-submission process</p>
            <p className="mt-0.5 text-[10px] text-text-tertiary">
              After submission: Membership selection &rarr; Document verification &rarr; Admin review &rarr; TradTrust review &rarr; Approval &rarr; Public profile published. Estimated review time: 5 business days.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border p-4">
        <Checkbox
          id="agree"
          checked={data.agreedToTerms}
          onChange={(e) => onChange('agreedToTerms', e.target.checked)}
        />
        <label htmlFor="agree" className="pt-0.5 text-xs leading-relaxed text-text-tertiary">
          I confirm that all the information provided above is accurate and complete. I agree to the{' '}
          <span className="text-accent">Terms of Service</span> and{' '}
          <span className="text-accent">Privacy Policy</span> of TRADINGO TradeServ.
          <span className="ml-1 text-accent">*</span>
        </label>
      </div>
      {errors.agreedToTerms && <p className="text-xs text-red-400">{errors.agreedToTerms}</p>}
    </div>
  );
}
