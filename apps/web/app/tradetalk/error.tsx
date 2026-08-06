'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function TradeTalkError({
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
      title="TradeTalk error"
      message="Something went wrong while loading TradeTalk. Please try again."
      showHome
    />
  );
}
