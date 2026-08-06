'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { RegistrationData, ServiceOffering } from '../types';
import type { StepErrors } from '../validation';
import { CATEGORIES, PRICING_MODELS } from '../types';

interface Props {
  data: RegistrationData;
  errors: StepErrors;
  onChange: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function Step3Services({ data, errors, onChange }: Props) {
  const addService = () => {
    onChange('services', [...data.services, { id: genId(), name: '', description: '', price: '' }]);
  };

  const updateService = (id: string, field: keyof ServiceOffering, value: string) => {
    onChange('services', data.services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeService = (id: string) => {
    onChange('services', data.services.filter((s) => s.id !== id));
  };

  const errorFor = (key: string) => {
    const err = errors[key];
    if (err) return err;
    const prefixKey = Object.keys(errors).find((k) => k.startsWith(key.replace('.', '\\.')));
    return prefixKey ? errors[prefixKey] : undefined;
  };

  return (
    <div className="space-y-8">
      <Field label="Professional Category" error={errors.category} required>
        <select
          value={data.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        >
          <option value="" className="bg-bg-base">Select your primary category...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-bg-base">{c}</option>
          ))}
        </select>
      </Field>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Services Offered</h3>
          <button onClick={addService} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
            <Plus size={14} /> Add Service
          </button>
        </div>
        {errors.services && <p className="mt-1 text-xs text-red-400">{errors.services}</p>}
        <div className="mt-3 space-y-3">
          {data.services.length === 0 && (
            <p className="text-sm text-text-tertiary italic">No services added yet. Click "Add Service" to list what you offer.</p>
          )}
          {data.services.map((s, i) => (
            <div key={s.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] text-text-tertiary">Service Name</label>
                  <input
                    value={s.name}
                    onChange={(e) => updateService(s.id, 'name', e.target.value)}
                    placeholder="Tax Filing, Audit..."
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none"
                  />
                  {errorFor(`services.${i}.name`) && <p className="mt-1 text-[10px] text-red-400">{errorFor(`services.${i}.name`)}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-text-tertiary">Starting Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={s.price}
                    onChange={(e) => updateService(s.id, 'price', e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none"
                  />
                  {errorFor(`services.${i}.price`) && <p className="mt-1 text-[10px] text-red-400">{errorFor(`services.${i}.price`)}</p>}
                </div>
                <div className="flex items-end justify-end">
                  <button onClick={() => removeService(s.id)} className="p-1.5 text-text-tertiary hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <label className="mb-1 block text-[10px] text-text-tertiary">Description (optional)</label>
                <input
                  value={s.description}
                  onChange={(e) => updateService(s.id, 'description', e.target.value)}
                  placeholder="Brief description of this service..."
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Pricing Model" error={errors.pricingModel} required>
          <select
            value={data.pricingModel}
            onChange={(e) => onChange('pricingModel', e.target.value as 'hourly' | 'fixed' | 'project')}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="" className="bg-bg-base">Select pricing model...</option>
            {PRICING_MODELS.map((m) => (
              <option key={m.value} value={m.value} className="bg-bg-base">{m.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Minimum Price (₹)" error={errors.priceMin} required>
          <input
            type="number"
            min="0"
            value={data.priceMin}
            onChange={(e) => onChange('priceMin', e.target.value)}
            placeholder="1000"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
        <Field label="Maximum Price (₹)" error={errors.priceMax} required>
          <input
            type="number"
            min="0"
            value={data.priceMax}
            onChange={(e) => onChange('priceMax', e.target.value)}
            placeholder="50000"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </Field>
      </div>
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
