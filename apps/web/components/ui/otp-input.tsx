'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({ length = 6, value, onChange, disabled, className }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newVal = [...value];
    newVal[index] = val.slice(-1);
    onChange(newVal);
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(paste.split(''));
    const nextFocus = Math.min(paste.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface text-center text-lg font-semibold text-text-primary transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary',
            value[i] && 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
          )}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
