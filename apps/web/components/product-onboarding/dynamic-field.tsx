'use client';

import { useState, useId } from 'react';
import { Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AttributeTemplateField } from '@/lib/product-onboarding/types';

interface DynamicFieldProps {
  field: AttributeTemplateField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
}

export function DynamicField({ field, value, error, onChange }: DynamicFieldProps) {
  const fieldId = useId();
  const [, setFocused] = useState(false);

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleMultiSelectToggle = (option: string) => {
    const current: string[] = Array.isArray(value) ? value : [];
    const idx = current.indexOf(option);
    if (idx >= 0) {
      onChange(current.filter((v) => v !== option));
    } else {
      onChange([...current, option]);
    }
  };

  const handleRemoveTag = (option: string) => {
    const current: string[] = Array.isArray(value) ? value : [];
    onChange(current.filter((v) => v !== option));
  };

  const renderField = () => {
    switch (field.type) {
      case 'TEXT':
      case 'URL':
      case 'EMAIL':
        return (
          <Input
            id={fieldId}
            type={field.type === 'URL' ? 'url' : field.type === 'EMAIL' ? 'email' : 'text'}
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            minLength={field.minLength}
            maxLength={field.maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        );

      case 'NUMBER':
        return (
          <div className="relative">
            <Input
              id={fieldId}
              type="number"
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={field.placeholder}
              min={field.minValue}
              max={field.maxValue}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {field.unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                {field.unit}
              </span>
            )}
          </div>
        );

      case 'TEXTAREA':
        return (
          <Textarea
            id={fieldId}
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            maxLength={field.maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        );

      case 'RICH_TEXT':
        return (
          <Textarea
            id={fieldId}
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            rows={8}
            maxLength={field.maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        );

      case 'SELECT':
        return (
          <select
            id={fieldId}
            value={value ?? ''}
            onChange={handleSelectChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-text-tertiary',
            )}
          >
            <option value="" disabled>
              {field.placeholder || 'Select...'}
            </option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'MULTI_SELECT': {
        const selected: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {selected.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary-500/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {field.options
                .filter((opt) => !selected.includes(opt))
                .map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleMultiSelectToggle(opt)}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-dark-border dark:bg-dark-surface dark:hover:border-primary-500"
                  >
                    + {opt}
                  </button>
                ))}
            </div>
          </div>
        );
      }

      case 'BOOLEAN':
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={!!value}
              onClick={() => handleChange(!value)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                value ? 'bg-primary-600' : 'bg-surface-tertiary dark:bg-dark-surface-tertiary',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                  value ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
            <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
              {value ? 'Yes' : 'No'}
            </span>
          </div>
        );

      case 'DATE':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        );

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium',
            error ? 'text-red-600 dark:text-red-400' : 'text-text-primary dark:text-dark-text-primary',
          )}
        >
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {field.helpText && (
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-text-tertiary cursor-help" />
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-dark-border dark:bg-dark-surface">
              {field.helpText}
            </div>
          </div>
        )}
      </div>
      {renderField()}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
