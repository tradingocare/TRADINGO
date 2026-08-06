'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateReferral } from '@/lib/api/referral';

interface ReferralCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'error';

export function ReferralCodeInput({ value, onChange, error, disabled, className }: ReferralCodeInputProps) {
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestRef = useRef('');

  const doValidate = useCallback(async (code: string) => {
    if (!code || code.length < 4) {
      setValidationState('idle');
      setValidationMessage('');
      return;
    }

    latestRef.current = code;
    setValidationState('validating');

    try {
      const result = await validateReferral(code.toUpperCase());
      if (latestRef.current !== code) return;

      if (result.valid) {
        setValidationState('valid');
        setValidationMessage('Valid referral code!');
      } else {
        setValidationState('invalid');
        setValidationMessage(result.reason || 'Invalid referral code');
      }
    } catch {
      if (latestRef.current !== code) return;
      setValidationState('error');
      setValidationMessage('Could not verify code');
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 4) {
      setValidationState('idle');
      setValidationMessage('');
      return;
    }

    debounceRef.current = setTimeout(() => doValidate(value), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, doValidate]);

  const handleChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    onChange(upper);
  };

  const showError = error && validationState === 'idle';

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-medium text-text-primary">
        Referral Code <span className="text-text-tertiary">(optional)</span>
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Gift className={cn(
            'h-4 w-4',
            validationState === 'valid' ? 'text-emerald-500' : 'text-text-tertiary',
          )} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter referral code (e.g. TRADXXXXXXXX)"
          className={cn(
            'block w-full rounded-lg border bg-surface py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-secondary/50 transition-all',
            'focus:outline-none focus:ring-2',
            validationState === 'valid' ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20' :
            validationState === 'invalid' ? 'border-status-error/50 focus:border-status-error focus:ring-status-error/20' :
            showError ? 'border-status-error/50' :
            'border-border focus:border-accent focus:ring-accent/20',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {validationState === 'validating' && <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />}
          {validationState === 'valid' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {validationState === 'invalid' && <XCircle className="h-4 w-4 text-status-error" />}
        </div>
      </div>
      {validationState === 'valid' && (
        <p className="flex items-center gap-1 text-xs text-emerald-500">
          <CheckCircle2 className="h-3 w-3" />
          {validationMessage}
        </p>
      )}
      {validationState === 'invalid' && (
        <p className="flex items-center gap-1 text-xs text-status-error">
          <XCircle className="h-3 w-3" />
          {validationMessage}
        </p>
      )}
      {validationState === 'error' && (
        <p className="flex items-center gap-1 text-xs text-text-tertiary">
          {validationMessage}
        </p>
      )}
      {showError && (
        <p className="text-xs text-status-error">{error}</p>
      )}
    </div>
  );
}
