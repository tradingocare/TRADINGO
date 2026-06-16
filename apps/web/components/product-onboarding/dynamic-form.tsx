'use client';

import { useMemo } from 'react';
import { getSections, getFieldsBySection } from '@/lib/product-onboarding/attribute-template-engine';
import { DynamicField } from './dynamic-field';
import type { AttributeTemplate, AttributeTemplateField } from '@/lib/product-onboarding/types';

interface DynamicFormProps {
  fields: AttributeTemplateField[];
  values: Record<string, any>;
  errors: Record<string, string[]>;
  onChange: (key: string, value: any) => void;
  template?: AttributeTemplate;
}

export function DynamicForm({ fields, values, errors, onChange, template }: DynamicFormProps) {
  const sections = useMemo(() => {
    if (template) return getSections(template);
    const sectionSet = new Set<string>();
    for (const field of fields) {
      if (field.section) sectionSet.add(field.section);
    }
    return Array.from(sectionSet).sort();
  }, [fields, template]);

  const fieldsBySection = useMemo(() => {
    if (sections.length === 0) {
      return { '': fields.filter((f) => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder) };
    }
    const map: Record<string, AttributeTemplateField[]> = {};
    for (const section of sections) {
      if (template) {
        map[section] = getFieldsBySection(template, section);
      } else {
        map[section] = fields
          .filter((f) => f.section === section && f.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }
    }
    return map;
  }, [sections, fields, template]);

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary p-12 text-center dark:border-dark-border dark:bg-dark-surface-secondary">
        <p className="text-sm text-text-tertiary">No fields defined for this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(fieldsBySection).map(([section, sectionFields]) => {
        if (sectionFields.length === 0) return null;
        return (
          <div key={section || '__default'}>
            {section && (
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                  {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
                </h3>
                <div className="mt-1.5 h-px bg-border dark:bg-dark-border" />
              </div>
            )}
            <div className="space-y-5">
              {sectionFields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={values[field.key]}
                  error={
                    errors[field.key]?.length > 0 ? errors[field.key][0] : undefined
                  }
                  onChange={(value) => onChange(field.key, value)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
