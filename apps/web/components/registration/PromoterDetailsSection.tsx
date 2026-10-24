'use client';

import FormField from '@/app/register/vendor/components/FormField';
import { Select } from '@/components/ui/select';

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:border-[var(--input-focus-border)] transition-all duration-200';
const inputStyle = (hasError: boolean) => ({
  backgroundColor: 'var(--bg-elevated)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-color)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
});

const DESIGNATIONS = ['Proprietor', 'Partner', 'Director', 'CEO/MD', 'Manager', 'Authorized Signatory', 'Other'];

export interface PromoterDetailsSectionProps {
  ownerName: string;
  designation: string;
  ownerNameError?: string;
  designationError?: string;
  touchedOwnerName?: boolean;
  touchedDesignation?: boolean;
  onOwnerNameChange: (value: string) => void;
  onDesignationChange: (value: string) => void;
  onBlurField: (field: 'ownerName' | 'designation') => void;
}

/**
 * Promoter / owner identity block of the canonical seller registration.
 * Presentational field mapping over the existing contactCredentials owner
 * fields (ownerName, designation) — same validation messages, same
 * letter-only name rule, same designation vocabulary as Step 2. No data
 * fetching, no persistence, no identity logic of its own.
 */
export function PromoterDetailsSection({
  ownerName,
  designation,
  ownerNameError,
  designationError,
  touchedOwnerName,
  touchedDesignation,
  onOwnerNameChange,
  onDesignationChange,
  onBlurField,
}: PromoterDetailsSectionProps) {
  return (
    <div className="space-y-5">
      <FormField label="Owner / Promoter Name" required error={touchedOwnerName ? ownerNameError : undefined}>
        <input
          className={INPUT_CLASS}
          style={inputStyle(!!ownerNameError && !!touchedOwnerName)}
          placeholder="Full name"
          autoComplete="name"
          value={ownerName}
          onChange={(e) => onOwnerNameChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
          onBlur={() => onBlurField('ownerName')}
        />
      </FormField>

      <FormField label="Designation" required error={touchedDesignation ? designationError : undefined}>
        <Select
          value={designation}
          onChange={(e) => onDesignationChange(e.target.value)}
          onBlur={() => onBlurField('designation')}
          aria-label="Designation"
        >
          <option value="">Select</option>
          {DESIGNATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
