'use client';

import { useState, useId, useRef } from 'react';
import { Info, X, Camera, Upload, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TemplateField, TemplateFieldType } from '@/lib/product-onboarding/types';

interface FieldRendererProps {
  field: TemplateField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
}

export function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
  const fieldId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (option: string) => {
    const current: string[] = Array.isArray(value) ? value : [];
    const idx = current.indexOf(option);
    if (idx >= 0) {
      onChange(current.filter((v) => v !== option));
    } else {
      onChange([...current, option]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const current: string[] = Array.isArray(value) ? value : [];
    onChange(current.filter((v) => v !== tag));
  };

  const options: string[] = Array.isArray(field.options) ? field.options : [];
  const selected: string[] = Array.isArray(value) ? value : [];
  const parsedOptions: { label: string; value: string }[] = options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o,
  );

  const renderField = () => {
    switch (field.type as TemplateFieldType) {
      case 'TEXT':
      case 'URL':
        return (
          <Input
            id={fieldId}
            type={field.type === 'URL' ? 'url' : 'text'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'PHONE':
        return (
          <Input
            id={fieldId}
            type="tel"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || '+91 98765 43210'}
          />
        );

      case 'NUMBER':
        return (
          <div className="relative">
            <Input
              id={fieldId}
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {field.unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                {field.unit}
              </span>
            )}
          </div>
        );

      case 'PRICE':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">₹</span>
            <Input
              id={fieldId}
              type="number"
              step="0.01"
              min="0"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={field.placeholder || '0.00'}
              className="pl-7"
            />
          </div>
        );

      case 'TEXTAREA':
        return (
          <Textarea
            id={fieldId}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case 'RICH_TEXT':
        return (
          <Textarea
            id={fieldId}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={8}
          />
        );

      case 'SELECT':
        return (
          <select
            id={fieldId}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-text-tertiary',
            )}
          >
            <option value="" disabled>
              {field.placeholder || 'Select...'}
            </option>
            {parsedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'RADIO':
        return (
          <div className="space-y-2">
            {parsedOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={fieldId}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="h-4 w-4 border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-text-primary">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={fieldId}
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <Label htmlFor={fieldId} className="text-sm font-normal cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      case 'MULTI_SELECT':
      case 'TAGS':
        return (
          <div className="space-y-2">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                  >
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-0.5 rounded-full p-0.5 hover:bg-primary-500/20">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {parsedOptions
                .filter((opt) => !selected.includes(opt.value))
                .map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggle(opt.value)}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary-400 hover:text-primary-600"
                  >
                    + {opt.label}
                  </button>
                ))}
              {field.type === 'TAGS' && (
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="Add custom..."
                    className="h-7 w-28 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                        handleToggle((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'DATE':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'IMAGE':
      case 'VIDEO':
      case 'FILE':
      case 'PDF':
        return (
          <div className="space-y-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-secondary p-6 transition-colors hover:border-primary-400 hover:bg-primary-50/50"
            >
              {field.type === 'IMAGE' ? (
                <Camera className="mb-2 h-8 w-8 text-text-tertiary" />
              ) : (
                <Upload className="mb-2 h-8 w-8 text-text-tertiary" />
              )}
              <p className="text-sm font-medium text-text-secondary">
                {value ? value : field.placeholder || `Upload ${field.type.toLowerCase()}`}
              </p>
              <p className="mt-0.5 text-xs text-text-tertiary">Click to browse or drag & drop</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={
                field.type === 'IMAGE'
                  ? 'image/*'
                  : field.type === 'VIDEO'
                    ? 'video/*'
                    : field.type === 'PDF'
                      ? 'application/pdf'
                      : undefined
              }
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange(file.name);
              }}
            />
          </div>
        );

      case 'LOCATION':
        return (
          <div className="space-y-2">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                id={fieldId}
                type="text"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder || 'Search location...'}
                className="pl-9"
              />
            </div>
          </div>
        );

      case 'JSON':
        return (
          <Textarea
            id={fieldId}
            value={typeof value === 'string' ? value : JSON.stringify(value ?? '', null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder={field.placeholder || '{}'}
            rows={6}
            className="font-mono text-xs"
          />
        );

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (field.type === 'CHECKBOX') return renderField();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium',
            error ? 'text-red-600' : 'text-text-primary',
          )}
        >
          {field.label}
          {field.isRequired && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        {field.helpText && (
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-text-tertiary cursor-help" />
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {field.helpText}
            </div>
          </div>
        )}
      </div>
      {renderField()}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
