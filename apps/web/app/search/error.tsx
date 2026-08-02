'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Search Error" message="Something went wrong with your search" error={error} reset={reset} showHome />;
}
