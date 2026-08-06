'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function CompanyProfileError({
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
      title="Could not load this profile"
      message="We had trouble loading this trador's profile. Please try again."
      showHome
    />
  );
}
