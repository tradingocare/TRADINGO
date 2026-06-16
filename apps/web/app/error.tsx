'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Something went wrong"
      message="An unexpected error occurred. Please try again."
      showHome
    />
  );
}
