'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function BuyerError({
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
      title="Buyer dashboard error"
      message="Something went wrong while loading this page. Please try again."
      showHome
      showDashboard
      dashboardHref="/buyer/dashboard"
    />
  );
}
