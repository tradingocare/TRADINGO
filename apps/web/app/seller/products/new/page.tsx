'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { NewProductWizard } from './wizard';

export default function NewProductPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    }>
      <NewProductWizard />
    </Suspense>
  );
}
