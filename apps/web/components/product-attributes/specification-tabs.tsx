'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProductAttributesSection } from './product-attributes-section';
import type { ProductAttributeSection as ProductAttributeSectionType } from '@/types/product-detail';

interface SpecificationTabsProps {
  sections: ProductAttributeSectionType[];
}

export function SpecificationTabs({ sections }: SpecificationTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (sections.length === 0) return null;

  if (sections.length === 1) {
    return <ProductAttributesSection section={sections[0]} defaultOpen />;
  }

  return (
    <div>
      <div className="flex overflow-x-auto gap-1 border-b border-border pb-px dark:border-dark-border scrollbar-none">
        {sections.map((section, idx) => (
          <button
            key={section.sectionId}
            onClick={() => setActiveTab(idx)}
            className={cn(
              'flex-shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg border-b-2 -mb-px',
              activeTab === idx
                ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary',
            )}
          >
            {section.sectionTitle}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <ProductAttributesSection section={sections[activeTab]} defaultOpen />
      </div>
    </div>
  );
}
