'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AttributeRow } from './attribute-row';
import type { ProductAttributeSection as ProductAttributeSectionType } from '@/types/product-detail';

interface ProductAttributesSectionProps {
  section: ProductAttributeSectionType;
  defaultOpen?: boolean;
}

export function ProductAttributesSection({ section, defaultOpen = false }: ProductAttributesSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (section.fields.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface dark:border-dark-border dark:bg-dark-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
            {section.sectionTitle}
          </h3>
          {section.sectionDescription && (
            <p className="mt-0.5 text-xs text-text-tertiary dark:text-dark-text-tertiary">
              {section.sectionDescription}
            </p>
          )}
        </div>
        {open ? <ChevronDown className="h-5 w-5 text-text-tertiary" /> : <ChevronRight className="h-5 w-5 text-text-tertiary" />}
      </button>

      {open && (
        <div className="px-2 pb-3">
          <Separator className="mb-2" />
          {section.fields.map((field) => (
            <AttributeRow key={field.fieldId} field={field} />
          ))}
        </div>
      )}
    </div>
  );
}
