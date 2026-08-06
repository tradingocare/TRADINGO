'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function AuthError({
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
      title="Authentication Error"
      message="Something went wrong. Please try again or return to login."
      showHome={false}
      showDashboard
      dashboardHref="/login"
    />
  );
}
