'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { RegistrationData, Qualification, Certification } from '../types';
import type { StepErrors } from '../validation';
import { LANGUAGES } from '../types';

interface Props {
  data: RegistrationData;
  errors: StepErrors;
  onChange: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function Step2ProfessionalInfo({ data, errors, onChange }: Props) {
  const [langSearch, setLangSearch] = useState('');

  const filteredLanguages = LANGUAGES.filter(
    (l) => !data.languages.includes(l) && l.toLowerCase().includes(langSearch.toLowerCase())
  );

  const addQualification = () => {
    onChange('qualifications', [...data.qualifications, { id: genId(), degree: '', institution: '', year: '' }]);
  };

  const updateQualification = (id: string, field: keyof Qualification, value: string) => {
    onChange('qualifications', data.qualifications.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const removeQualification = (id: string) => {
    onChange('qualifications', data.qualifications.filter((q) => q.id !== id));
  };

  const addCertification = () => {
    onChange('certifications', [...data.certifications, { id: genId(), name: '', issuer: '', year: '' }]);
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    onChange('certifications', data.certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeCertification = (id: string) => {
    onChange('certifications', data.certifications.filter((c) => c.id !== id));
  };

  const addLanguage = (lang: string) => {
    onChange('languages', [...data.languages, lang]);
    setLangSearch('');
  };

  const removeLanguage = (lang: string) => {
    onChange('languages', data.languages.filter((l) => l !== lang));
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Experience</h3>
        <div className="mt-3 max-w-xs">
          <Field label="Years of Experience" error={errors.yearsOfExperience} required>
            <select
              value={data.yearsOfExperience}
              onChange={(e) => onChange('yearsOfExperience', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              <option value="" className="bg-bg-base">Select...</option>
              {['< 1 Year', '1-2 Years', '3-5 Years', '6-10 Years', '10+ Years', '15+ Years', '20+ Years'].map((y) => (
                <option key={y} value={y} className="bg-bg-base">{y}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Qualifications</h3>
          <button onClick={addQualification} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
            <Plus size={14} /> Add
          </button>
        </div>
        {errors.qualifications && <p className="mt-1 text-xs text-red-400">{errors.qualifications}</p>}
        <div className="mt-3 space-y-3">
          {data.qualifications.length === 0 && (
            <p className="text-sm text-text-tertiary italic">No qualifications added yet. Click "Add" to begin.</p>
          )}
          {data.qualifications.map((q) => (
            <div key={q.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-[10px] text-text-tertiary">Degree</label>
                <input
                  value={q.degree}
                  onChange={(e) => updateQualification(q.id, 'degree', e.target.value)}
placeholder="B.Com, CA, CS..."
                   className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none"
                 />
               </div>
               <div className="min-w-0 flex-1">
                 <label className="mb-1 block text-[10px] text-text-tertiary">Institution</label>
                 <input
                   value={q.institution}
                   onChange={(e) => updateQualification(q.id, 'institution', e.target.value)}
                   placeholder="University / Institute"
                   className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none"
                 />
               </div>
               <div className="w-20">
                 <label className="mb-1 block text-[10px] text-text-tertiary">Year</label>
                 <input
                   value={q.year}
                   onChange={(e) => updateQualification(q.id, 'year', e.target.value)}
                   placeholder="2024"
                   className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none"
                />
              </div>
              <button onClick={() => removeQualification(q.id)} className="p-1.5 text-text-tertiary hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Certifications (optional)</h3>
          <button onClick={addCertification} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {data.certifications.length === 0 && (
            <p className="text-sm text-text-tertiary italic">No certifications added.</p>
          )}
          {data.certifications.map((c) => (
            <div key={c.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-[10px] text-text-tertiary">Certification Name</label>
                <input
                  value={c.name}
                  onChange={(e) => updateCertification(c.id, 'name', e.target.value)}
placeholder="Certified Public Accountant"
                   className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none"
                 />
               </div>
               <div className="min-w-0 flex-1">
                 <label className="mb-1 block text-[10px] text-text-tertiary">Issuer</label>
                 <input
                   value={c.issuer}
                   onChange={(e) => updateCertification(c.id, 'issuer', e.target.value)}
                   placeholder="ICAI / ICSI"
                   className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none"
                 />
               </div>
               <div className="w-20">
                 <label className="mb-1 block text-[10px] text-text-tertiary">Year</label>
                 <input
                   value={c.year}
                   onChange={(e) => updateCertification(c.id, 'year', e.target.value)}
                   placeholder="2024"
                   className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none"
                />
              </div>
              <button onClick={() => removeCertification(c.id)} className="p-1.5 text-text-tertiary hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Languages</h3>
        {errors.languages && <p className="mt-1 text-xs text-red-400">{errors.languages}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {data.languages.map((lang) => (
            <span key={lang} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
              {lang}
              <button onClick={() => removeLanguage(lang)} className="hover:text-text-primary transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="relative mt-2">
          <input
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
placeholder="Search languages..."
             className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-primary/30 focus:border-accent/50 focus:outline-none"
          />
          {langSearch && filteredLanguages.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-border bg-bg-base shadow-xl">
              {filteredLanguages.map((l) => (
                <button
                  key={l}
                  onClick={() => addLanguage(l)}
                  className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
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
