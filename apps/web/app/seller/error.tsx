'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function SellerError({
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
      title="Seller dashboard error"
      message="Something went wrong while loading this page. Please try again."
      showHome
      showDashboard
      dashboardHref="/seller/dashboard"
    />
  );
}
